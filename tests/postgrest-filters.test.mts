import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildFilter, buildWhere } from "@/lib/prisma";

/**
 * These filters are string-built into a PostgREST query URL, so an unescaped
 * value can leave its slot and become another query parameter. The search box
 * feeds `contains` straight from user input (lib/queries/search.ts), which is how
 * a visitor could have appended their own filter and read unpublished rows.
 */
describe("filter value encoding", () => {
  it("encodes an ampersand so a value cannot start a new parameter", () => {
    const filter = buildFilter("title", "x&status=eq.draft");
    assert.ok(!filter.slice("title=".length).includes("&"), `still splittable: ${filter}`);
    assert.equal(filter, "title=eq.x%26status%3Deq.draft");
  });

  it("encodes an equals sign", () => {
    assert.ok(!buildFilter("name", "a=b").endsWith("a=b"));
    assert.equal(buildFilter("name", "a=b"), "name=eq.a%3Db");
  });

  it("encodes characters encodeURIComponent leaves alone", () => {
    // encodeURIComponent passes !'()* through, and parentheses are structural
    // inside in.(...) and or=(...).
    const encoded = buildFilter("name", "a(b)c*d!e'f");
    for (const raw of ["(", ")", "*", "!", "'"]) {
      assert.ok(!encoded.includes(raw), `${raw} survived in ${encoded}`);
    }
  });

  it("keeps a plain value readable", () => {
    assert.equal(buildFilter("status", "published"), "status=eq.published");
  });

  it("encodes the column name too", () => {
    assert.ok(!buildFilter("a&b", "x").startsWith("a&b="));
  });
});

describe("buildWhere", () => {
  it("joins several conditions with &", () => {
    assert.equal(
      buildWhere({ status: "published", authorId: "u1" }),
      "status=eq.published&authorId=eq.u1",
    );
  });

  it("maps operators onto PostgREST equivalents", () => {
    assert.equal(buildWhere({ views: { gte: 10 } }), "views=gte.10");
    assert.equal(buildWhere({ views: { lt: 5 } }), "views=lt.5");
    assert.equal(buildWhere({ name: { not: null } }), "name=not.is.null");
    assert.equal(buildWhere({ name: null }), "name=is.null");
  });

  it("wraps `contains` in wildcards while encoding the needle", () => {
    const where = buildWhere({ title: { contains: "kasih" } });
    assert.equal(where, "title=ilike.*kasih*");

    // Our own asterisks stay structural; an injected & does not survive.
    const hostile = buildWhere({ title: { contains: "a&b" } });
    assert.equal(hostile, "title=ilike.*a%26b*");
  });

  it("quotes values inside in.(...) so a comma cannot extend the list", () => {
    const where = buildWhere({ id: { in: ["a", "b,c"] } });
    assert.ok(where.startsWith("id=in.("));
    // Each item is quoted, so the embedded comma is data rather than a separator.
    assert.equal(where, 'id=in.(%22a%22,%22b%2Cc%22)');
  });

  it("escapes a quote inside a quoted list value", () => {
    const where = buildWhere({ id: { in: ['a"b'] } });
    assert.ok(where.includes("%5C%22"), `backslash-escaped quote missing: ${where}`);
  });

  it("builds an OR group with dotted predicates", () => {
    const where = buildWhere({ OR: [{ title: { contains: "a" } }, { excerpt: { contains: "b" } }] });
    assert.ok(where.startsWith("or=("));
    assert.ok(where.includes("title.ilike."));
    assert.ok(where.includes("excerpt.ilike."));
  });

  it("keeps an injected ampersand out of an OR group", () => {
    const where = buildWhere({ OR: [{ title: { contains: "x&limit=9999" } }] });
    const inner = where.slice("or=(".length, -1);
    assert.ok(!inner.includes("&"), `OR group still splittable: ${where}`);
  });

  it("expands a compound unique key into its parts", () => {
    assert.equal(
      buildWhere({ userId_challengeId: { userId: "u1", challengeId: "c1" } }),
      "userId=eq.u1&challengeId=eq.c1",
    );
  });

  it("returns an empty string for no conditions", () => {
    assert.equal(buildWhere(undefined), "");
    assert.equal(buildWhere({}), "");
  });
});
