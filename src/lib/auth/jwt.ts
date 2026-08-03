import { SignJWT, jwtVerify } from "jose";
import { requiredSecret } from "@/lib/env";

const getAccessSecretString = requiredSecret(
  "JWT_ACCESS_SECRET",
  "insecure-dev-secret-do-not-use-in-prod",
);

// Encoded on first use so a missing secret fails at request time, not at
// build time — otherwise Vercel's build step would throw whenever the env
// var isn't projected into the build scope, breaking the deploy even when
// runtime traffic would have been perfectly configured.
let cachedAccessSecret: Uint8Array | null = null;
function getAccessSecret(): Uint8Array {
  if (cachedAccessSecret) return cachedAccessSecret;
  cachedAccessSecret = new TextEncoder().encode(getAccessSecretString());
  return cachedAccessSecret;
}

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes

export type AccessTokenPayload = {
  sub: string;
  email: string;
  role: string;
  name: string;
};

export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .setIssuer("livyn")
    .sign(getAccessSecret());
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAccessSecret(), { issuer: "livyn" });
    return payload as unknown as AccessTokenPayload;
  } catch {
    return null;
  }
}
