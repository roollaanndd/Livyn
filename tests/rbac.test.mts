import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ROLES, hasRole, isRole, isAdmin, canModerate, outranks, rankOf } from "@/lib/auth/rbac";

describe("role table", () => {
  it("includes leader, which admins actually grant", () => {
    // /api/admin/leaders/[id] writes role: "leader" on approval. It was missing
    // from ROLES, so hasRole() rejected verified pastors and the admin user form
    // (z.enum(ROLES)) refused to round-trip their role.
    assert.ok(isRole("leader"));
    assert.ok(ROLES.includes("leader"));
  });

  it("ranks leader above a plain member but below a contributor", () => {
    assert.ok(rankOf("leader") > rankOf("user"));
    assert.ok(rankOf("leader") < rankOf("contributor"));
  });

  it("treats an unknown role as least privileged rather than throwing", () => {
    assert.equal(rankOf("archbishop"), 0);
    assert.equal(rankOf(undefined), 0);
    assert.equal(hasRole("archbishop", "moderator"), false);
  });

  it("gives a leader no moderation powers", () => {
    assert.equal(canModerate("leader"), false);
    assert.equal(isAdmin("leader"), false);
    assert.ok(hasRole("leader", "user"));
  });
});

describe("hasRole", () => {
  it("is satisfied by an exact match", () => {
    for (const role of ROLES) assert.ok(hasRole(role, role));
  });

  it("is satisfied by anything higher", () => {
    assert.ok(hasRole("super_admin", "user"));
    assert.ok(hasRole("admin", "moderator"));
    assert.ok(hasRole("moderator", "contributor"));
  });

  it("rejects anything lower", () => {
    assert.equal(hasRole("user", "contributor"), false);
    assert.equal(hasRole("contributor", "moderator"), false);
    assert.equal(hasRole("moderator", "admin"), false);
    assert.equal(hasRole("admin", "super_admin"), false);
  });
});

describe("outranks", () => {
  it("refuses equal ranks, so peers cannot act on each other", () => {
    // The hole this closes: a moderator suspending another moderator, and an
    // admin demoting a peer admin.
    for (const role of ROLES) assert.equal(outranks(role, role), false);
  });

  it("stops a moderator from touching an admin or super_admin", () => {
    assert.equal(outranks("moderator", "admin"), false);
    assert.equal(outranks("moderator", "super_admin"), false);
  });

  it("stops an admin from demoting a super_admin", () => {
    assert.equal(outranks("admin", "super_admin"), false);
  });

  it("allows action strictly downward", () => {
    assert.ok(outranks("super_admin", "admin"));
    assert.ok(outranks("admin", "moderator"));
    assert.ok(outranks("moderator", "user"));
    assert.ok(outranks("moderator", "leader"));
  });
});
