import { hash, verify } from "@node-rs/argon2";

// Argon2id, OWASP-recommended parameters (memory in KiB).
// algorithm: 2 = Argon2id (see @node-rs/argon2's Algorithm const enum).
const ARGON2_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
  algorithm: 2,
};

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, ARGON2_OPTIONS);
}

export async function verifyPassword(hashValue: string, plain: string): Promise<boolean> {
  try {
    return await verify(hashValue, plain, ARGON2_OPTIONS);
  } catch {
    return false;
  }
}
