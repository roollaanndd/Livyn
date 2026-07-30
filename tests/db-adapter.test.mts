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
    calls.push({
      url: String(input),
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
  it("resolves increment against the current value instead of discarding it", async () => {
    // The adapter used to `continue` past any { increment } operand, so the write
    // succeeded while the field never moved. Production proof: a member with four
    // chapters marked had pointsEarned frozen at 12 and User.points still 0.
    stubFetch([
      { json: [{ points: 40 }] }, // read of the column being incremented
      { json: [{ id: "u1", points: 55 }] }, // the PATCH
    ]);

    await prisma.user.update({ where: { id: "u1" }, data: { points: { increment: 15 } } });

    const patch = calls.find((c) => c.method === "PATCH");
    assert.ok(patch, "no PATCH issued");
    assert.equal((patch.body as Record<string, unknown>).points, 55);
  });

  it("treats a missing or non-numeric current value as zero", async () => {
    stubFetch([{ json: [{}] }, { json: [{ id: "s1", viewCount: 1 }] }]);

    await prisma.sermon.update({ where: { id: "s1" }, data: { viewCount: { increment: 1 } } });

    assert.equal(
      (calls.find((c) => c.method === "PATCH")!.body as Record<string, unknown>).viewCount,
      1,
    );
  });

  it("subtracts for decrement", async () => {
    stubFetch([{ json: [{ points: 10 }] }, { json: [{ id: "u1", points: 7 }] }]);

    await prisma.user.update({ where: { id: "u1" }, data: { points: { decrement: 3 } } });

    assert.equal(
      (calls.find((c) => c.method === "PATCH")!.body as Record<string, unknown>).points,
      7,
    );
  });

  it("carries plain fields through alongside a delta", async () => {
    stubFetch([{ json: [{ points: 1 }] }, { json: [{ id: "u1" }] }]);

    await prisma.user.update({
      where: { id: "u1" },
      data: { points: { increment: 2 }, name: "Budi" },
    });

    const body = calls.find((c) => c.method === "PATCH")!.body as Record<string, unknown>;
    assert.equal(body.points, 3);
    assert.equal(body.name, "Budi");
  });

  it("scopes the pre-read to the same row being updated", async () => {
    stubFetch([{ json: [{ pointsEarned: 12 }] }, { json: [{ id: "p1" }] }]);

    await prisma.challengeProgress.update({
      where: { userId_challengeId: { userId: "u1", challengeId: "c1" } },
      data: { pointsEarned: { increment: 10 } },
    });

    const read = calls[0];
    assert.equal(read.method, "GET");
    assert.ok(read.url.includes("userId=eq.u1"), read.url);
    assert.ok(read.url.includes("challengeId=eq.c1"), read.url);
    assert.equal(
      (calls.find((c) => c.method === "PATCH")!.body as Record<string, unknown>).pointsEarned,
      22,
    );
  });
});

describe("updatedAt handling", () => {
  it("stamps updatedAt on User, which the table list used to omit", async () => {
    stubFetch([{ json: [{ id: "u1" }] }]);
    await prisma.user.update({ where: { id: "u1" }, data: { name: "Budi" } });
    assert.ok(typeof (calls[0].body as Record<string, unknown>).updatedAt === "string");
  });

  it("does not invent updatedAt on a table without the column", async () => {
    // PasswordResetToken has no updatedAt; sending one makes PostgREST reject
    // the whole request.
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
});
