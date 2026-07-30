/**
 * Session lifetimes, kept in a module of their own.
 *
 * They live here rather than beside the code that mints tokens because both the
 * Node and the Edge runtime need them: session.ts reads REFRESH_TOKEN_TTL_DAYS
 * to set a cookie's max-age, and importing it from tokens.ts dragged
 * `node:crypto` into every Edge route that only wanted to identify the caller.
 */

/** Access tokens are short-lived; the refresh cookie is what keeps a session alive. */
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes

export const REFRESH_TOKEN_TTL_DAYS = 30;
