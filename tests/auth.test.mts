import { describe, it } from "node:test";
import assert from "node:assert/strict";

process.env.JWT_ACCESS_SECRET = "unit-test-secret-value-long-enough";

const { signAccessToken, verifyAccessToken } = await import("@/lib/auth/jwt");
const { loginSchema, registerSchema, resetPasswordSchema } = await import("@/lib/validation/auth");
const { accessTokenSecret } = await import("@/lib/env");

const payload = { sub: "u1", email: "a@b.com", role: "user", name: "Budi" };

describe("access tokens", () => {
  it("round-trips a payload", async () => {
    const verified = await verifyAccessToken(await signAccessToken(payload));
    assert.equal(verified?.sub, "u1");
    assert.equal(verified?.role, "user");
  });

  it("rejects a tampered signature", async () => {
    const token = await signAccessToken(payload);
    const [header, body] = token.split(".");
    assert.equal(await verifyAccessToken(`${header}.${body}.deadbeef`), null);
  });

  it("rejects a token that carries no signature at all", async () => {
    const [header, body] = (await signAccessToken(payload)).split(".");
    assert.equal(await verifyAccessToken(`${header}.${body}.`), null);
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await signAccessToken(payload);
    process.env.JWT_ACCESS_SECRET = "a-completely-different-secret-value";
    try {
      assert.equal(await verifyAccessToken(token), null);
    } finally {
      process.env.JWT_ACCESS_SECRET = "unit-test-secret-value-long-enough";
    }
  });

  it("rejects a syntactically invalid token", async () => {
    assert.equal(await verifyAccessToken("not-a-jwt"), null);
  });
});

describe("secret loading", () => {
  it("refuses to serve a production request without JWT_ACCESS_SECRET", () => {
    // The old fallback was a constant committed to this repository, so a missing
    // env var in production meant anyone could mint an admin session token.
    const secret = process.env.JWT_ACCESS_SECRET;
    const nodeEnv = process.env.NODE_ENV;
    try {
      delete process.env.JWT_ACCESS_SECRET;
      (process.env as Record<string, string>).NODE_ENV = "production";
      assert.throws(() => accessTokenSecret(), /JWT_ACCESS_SECRET/);
    } finally {
      process.env.JWT_ACCESS_SECRET = secret;
      (process.env as Record<string, string>).NODE_ENV = nodeEnv ?? "test";
    }
  });

  it("still runs from a bare checkout in development", () => {
    const secret = process.env.JWT_ACCESS_SECRET;
    try {
      delete process.env.JWT_ACCESS_SECRET;
      assert.ok(accessTokenSecret().byteLength > 0);
    } finally {
      process.env.JWT_ACCESS_SECRET = secret;
    }
  });
});

describe("registration rules", () => {
  it("normalises the email so duplicates cannot slip in by case", () => {
    const parsed = registerSchema.parse({ name: "Budi", email: "  BuDi@Mail.COM ", password: "Password1" });
    assert.equal(parsed.email, "budi@mail.com");
  });

  it("requires upper, lower, a digit, and eight characters", () => {
    const base = { name: "Budi", email: "a@b.com" };
    for (const password of ["short1A", "alllowercase1", "ALLUPPERCASE1", "NoDigitsHere"]) {
      assert.equal(registerSchema.safeParse({ ...base, password }).success, false, password);
    }
    assert.ok(registerSchema.safeParse({ ...base, password: "Password1" }).success);
  });

  it("normalises the login email the same way", () => {
    assert.equal(loginSchema.parse({ email: " A@B.COM ", password: "x" }).email, "a@b.com");
  });
});

describe("password reset rules", () => {
  it("holds a reset to the same strength as registration", () => {
    assert.equal(resetPasswordSchema.safeParse({ token: "t", password: "weak" }).success, false);
    assert.ok(resetPasswordSchema.safeParse({ token: "t", password: "Password1" }).success);
  });

  it("requires a token", () => {
    assert.equal(resetPasswordSchema.safeParse({ token: "", password: "Password1" }).success, false);
  });
});
