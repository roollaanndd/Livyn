import { SignJWT, jwtVerify } from "jose";
import { requiredSecret } from "@/lib/env";

const ACCESS_SECRET = new TextEncoder().encode(
  requiredSecret("JWT_ACCESS_SECRET", "insecure-dev-secret-do-not-use-in-prod"),
);

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
    .sign(ACCESS_SECRET);
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, ACCESS_SECRET, { issuer: "livyn" });
    return payload as unknown as AccessTokenPayload;
  } catch {
    return null;
  }
}
