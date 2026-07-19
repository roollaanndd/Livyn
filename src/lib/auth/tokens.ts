import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/prisma";

export const REFRESH_TOKEN_TTL_DAYS = 30;

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

  await prisma.refreshToken.create({
    data: { userId, tokenHash: hashToken(token), family, expiresAt },
  });

  return { token, expiresAt };
}

/**
 * Rotates a refresh token: validates the presented token, revokes it, and
 * issues a replacement in the same family. If a token is reused after being
 * revoked (replay), the whole family is revoked — the classic rotation
 * detection pattern for stolen refresh tokens.
 */
export async function rotateRefreshToken(presentedToken: string) {
  const tokenHash = hashToken(presentedToken);
  const record = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!record) return { error: "invalid" as const };

  if (record.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { family: record.family, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { error: "reuse_detected" as const };
  }

  if (record.expiresAt < new Date()) return { error: "expired" as const };

  const newToken = newOpaqueToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date(), replacedBy: newToken },
    }),
    prisma.refreshToken.create({
      data: { userId: record.userId, tokenHash: hashToken(newToken), family: record.family, expiresAt },
    }),
  ]);

  return { userId: record.userId, token: newToken, expiresAt };
}

export async function revokeRefreshToken(presentedToken: string) {
  const tokenHash = hashToken(presentedToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
