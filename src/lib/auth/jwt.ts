import { SignJWT, jwtVerify } from "jose";
import { accessTokenSecret } from "@/lib/env";
import { ACCESS_TOKEN_TTL_SECONDS } from "./ttl";

export { ACCESS_TOKEN_TTL_SECONDS };

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
    .sign(accessTokenSecret());
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
  try {
    // HS256 is pinned: without it a token could name its own algorithm and a
    // forged `alg: "none"` header would verify against no signature at all.
    const { payload } = await jwtVerify(token, accessTokenSecret(), {
      issuer: "livyn",
      algorithms: ["HS256"],
    });
    return payload as unknown as AccessTokenPayload;
  } catch {
    return null;
  }
}
