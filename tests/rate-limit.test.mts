import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { clientIp, rateLimit, resetRateLimits } from "@/lib/rate-limit";

beforeEach(() => resetRateLimits());

describe("rateLimit", () => {
  it("allows exactly `limit` calls in a window, then refuses", () => {
    for (let i = 0; i < 3; i++) {
      assert.equal(rateLimit("k", 3, 60_000).ok, true, `call ${i + 1} should pass`);
    }
    assert.equal(rateLimit("k", 3, 60_000).ok, false);
  });

  it("reports how long the caller must wait", () => {
    rateLimit("k", 1, 60_000);
    const denied = rateLimit("k", 1, 60_000);
    assert.equal(denied.ok, false);
    assert.ok(denied.retryAfterMs > 0 && denied.retryAfterMs <= 60_000);
  });

  it("keeps separate keys independent", () => {
    rateLimit("a", 1, 60_000);
    assert.equal(rateLimit("a", 1, 60_000).ok, false);
    assert.equal(rateLimit("b", 1, 60_000).ok, true);
  });

  it("opens a fresh window once the old one expires", async () => {
    assert.equal(rateLimit("k", 1, 5).ok, true);
    assert.equal(rateLimit("k", 1, 5).ok, false);
    await new Promise((r) => setTimeout(r, 12));
    assert.equal(rateLimit("k", 1, 5).ok, true);
  });

  it("does not grow without bound as keys keep arriving", () => {
    // Keys are attacker-chosen (an IP, an email), so an ever-growing map is a way
    // to exhaust the process. Windows here are 1ms, so they expire immediately and
    // the sweep must reclaim them.
    for (let i = 0; i < 25_000; i++) rateLimit(`ip-${i}`, 5, 1);

    // Still functional after the churn.
    assert.equal(rateLimit("fresh", 1, 60_000).ok, true);
    assert.equal(rateLimit("fresh", 1, 60_000).ok, false);
  });
});

describe("clientIp", () => {
  it("takes the left-most forwarded address", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.9, 10.0.0.1, 10.0.0.2" });
    assert.equal(clientIp(headers), "203.0.113.9");
  });

  it("falls back to a constant when the header is absent", () => {
    assert.equal(clientIp(new Headers()), "unknown");
  });
});
