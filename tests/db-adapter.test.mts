import { beforeEach, describe, it, mock } from "node:test";
import assert from "node:assert/strict";

process.env.SUPABASE_URL = "https://project.example";
process.env.SUPABASE_ANON_KEY = "test-key";

const { prisma } = await import("@/lib/prisma");

type Call = { url: string; method: string; body: unknown };

let calls: Call[] = [];

/** Stands in for PostgREST: records every request and replays queued responses. */
function stubFetch(responses: Array<{ status?: number; json?: unknown; headers?: Record<string, string> }>) {
  let i = 0;
  mock.method(globalThis, "fetch", async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    calls.push({
      url,
      method: init?.method ?? "GET",
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    });
    const spec = responses[Math.min(i++, responses.length - 1)];
    return new Response(spec.json === undefined ? "" : JSON.stringify(spec.json), {
      status: spec.status ?? 200,
      headers: { "Content-Type": "application/json", ...(spec.headers ?? {}) },
    });
  });
}

beforeEach(() => {
  calls = [];
  mock.restoreAll();
});

describe("increment / decrement", () => {
  it("resolves increment against the current value instead of dropping it", async () => {
    // The adapter used to `continue` past any { increment } operand, so points,
    // pointsEarned and viewCount silently never moved. Nothing in the app noticed
    // because the write still succeeded.
    stubFetch([
      { json: [{ points: 40 }] }, // read of the column being incremented
      { json: [{ id: "u1", points: 55 }] }, // the PATCH
    ]);

    await prisma.user.update({ where: { id: "u1" }, data: { points: { increment: 15 } } });

    const patch = calls.find((c) => c.method === "PATCH");
    assert.ok(patch, "no PATCH issued");
    assert.deepEqual((patch.body as Record<string, unknown>).points, 55);
  });

  it("treats a missing or non-numeric current value as zero", async () => {
    stubFetch([{ json: [{}] }, { json: [{ id: "s1", viewCount: 1 }] }]);

    await prisma.sermon.update({ where: { id: "s1" }, data: { viewCount: { increment: 1 } } });

    const patch = calls.find((c) => c.method === "PATCH");
    assert.equal((patch!.body as Record<string, unknown>).viewCount, 1);
  });

  it("subtracts for decrement", async () => {
    stubFetch([{ json: [{ points: 10 }] }, { json: [{ id: "u1", points: 7 }] }]);

    await prisma.user.update({ where: { id: "u1" }, data: { points: { decrement: 3 } } });

    const patch = calls.find((c) => c.method === "PATCH");
    assert.equal((patch!.body as Record<string, unknown>).points, 7);
  });

  it("leaves plain fields alongside a delta untouched", async () => {
    stubFetch([{ json: [{ points: 1 }] }, { json: [{ id: "u1" }] }]);

    await prisma.user.update({
      where: { id: "u1" },
      data: { points: { increment: 2 }, name: "Budi" },
    });

    const body = calls.find((c) => c.method === "PATCH")!.body as Record<string, unknown>;
    assert.equal(body.points, 3);
    assert.equal(body.name, "Budi");
  });

  it("refuses a delta across many rows rather than writing a wrong number", async () => {
    stubFetch([{ json: [] }]);
    await assert.rejects(
      () => prisma.user.updateMany({ where: { role: "user" }, data: { points: { increment: 5 } } }),
      /not supported across multiple rows/,
    );
  });
});

describe("updatedAt handling", () => {
  it("stamps updatedAt on a table that declares it", async () => {
    stubFetch([{ json: [{ id: "n1" }] }]);
    await prisma.note.update({ where: { id: "n1" }, data: { text: "hi" } });
    const body = calls[0].body as Record<string, unknown>;
    assert.ok(typeof body.updatedAt === "string", "updatedAt not supplied");
  });

  it("stamps updatedAt on User, which the table list used to omit", async () => {
    stubFetch([{ json: [{ id: "u1" }] }]);
    await prisma.user.update({ where: { id: "u1" }, data: { name: "Budi" } });
    assert.ok(typeof (calls[0].body as Record<string, unknown>).updatedAt === "string");
  });

  it("does not invent updatedAt on a table without the column", async () => {
    // PasswordResetToken has no updatedAt; writing one made PostgREST reject the
    // request outright.
    stubFetch([{ json: [{ id: "t1" }] }]);
    await prisma.passwordResetToken.update({ where: { id: "t1" }, data: { usedAt: new Date() } });
    assert.equal((calls[0].body as Record<string, unknown>).updatedAt, undefined);
  });
});

describe("aggregate", () => {
  it("sums a column", async () => {
    // This method did not exist at all: prisma.devotion.aggregate resolved to
    // undefined and the contributor dashboard threw on `viewsAgg._sum`.
    stubFetch([{ json: [{ viewCount: 3 }, { viewCount: 4 }, { viewCount: 10 }] }]);

    const result = await prisma.devotion.aggregate({
      where: { authorId: "a1", status: "published" },
      _sum: { viewCount: true },
    });

    assert.equal(result._sum.viewCount, 17);
    assert.equal(result._count, 3);
  });

  it("reports null for a sum over no rows", async () => {
    stubFetch([{ json: [] }]);
    const result = await prisma.devotion.aggregate({ where: { authorId: "a1" }, _sum: { viewCount: true } });
    assert.equal(result._sum.viewCount, null);
    assert.equal(result._count, 0);
  });

  it("computes min, max and avg", async () => {
    stubFetch([{ json: [{ n: 2 }, { n: 8 }] }]);
    const result = await prisma.devotion.aggregate({
      where: {},
      _min: { n: true },
      _max: { n: true },
      _avg: { n: true },
    });
    assert.equal(result._min.n, 2);
    assert.equal(result._max.n, 8);
    assert.equal(result._avg.n, 5);
  });
});

describe("query building", () => {
  it("clamps take and skip to whole non-negative numbers", async () => {
    stubFetch([{ json: [] }]);
    await prisma.devotion.findMany({ take: 5.9, skip: -3 });
    assert.ok(calls[0].url.includes("limit=5"), calls[0].url);
    assert.ok(!calls[0].url.includes("offset="), calls[0].url);
  });

  it("only ever emits asc or desc for a sort direction", async () => {
    stubFetch([{ json: [] }]);
    await prisma.devotion.findMany({ orderBy: { createdAt: "sideways" as unknown as string } });
    assert.ok(calls[0].url.includes("createdAt.asc"), calls[0].url);
  });

  it("returns an empty array, not null, when a read fails", async () => {
    stubFetch([{ status: 500, json: { message: "boom" } }]);
    const rows = await prisma.devotion.findMany({ where: { status: "published" } });
    assert.deepEqual(rows, []);
  });
});
