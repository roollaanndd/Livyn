import { randomBytes, createHash } from "crypto";
import { db } from "@/lib/supabase-rest";
import { REFRESH_TOKEN_TTL_DAYS } from "./ttl";

export { REFRESH_TOKEN_TTL_DAYS };

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function newOpaqueToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Issues a brand new refresh token family (used at login). */
export async function issueRefreshToken(userId: string) {
  const token = newOpaqueToken();
  const family = newOpaqueToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await db.refreshToken.create({ userId, tokenHash: hashToken(token), family, expiresAt });

  return { token, expiresAt };
}

/**
 * Rotates a refresh token: validates the presented token, revokes it, and
 * issues a replacement in the same family. If a token is reused after being
 * revoked (replay), the whole family is revoked.
 */
export async function rotateRefreshToken(presentedToken: string) {
  const tokenHash = hashToken(presentedToken);
  const record = await db.refreshToken.findByHash(tokenHash);

  if (!record) return { error: "invalid" as const };

  if (record.revokedAt) {
    await db.refreshToken.revokeFamily(record.family);
    return { error: "reuse_detected" as const };
  }

  if (new Date(record.expiresAt) < new Date()) return { error: "expired" as const };

  const newToken = newOpaqueToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await db.refreshToken.rotate({
    oldId: record.id,
    replacedBy: newToken,
    userId: record.userId,
    newTokenHash: hashToken(newToken),
    family: record.family,
    expiresAt,
  });

  return { userId: record.userId, token: newToken, expiresAt };
}

export async function revokeRefreshToken(presentedToken: string) {
  const tokenHash = hashToken(presentedToken);
  await db.refreshToken.revoke(tokenHash);
}
