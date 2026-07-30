export const ROLES = ["user", "leader", "contributor", "moderator", "admin", "super_admin"] as const;
export type Role = (typeof ROLES)[number];

/**
 * Privilege ranks. Note "leader" sits just above "user": a verified pastor gets
 * larger circles and weekly missions (see lib/community/permissions), not any
 * moderation power, so it must not outrank contributor.
 *
 * Anything outside this table is treated as rank 0 rather than as an error, so
 * a role added to the database before it is added here degrades to the least
 * privilege instead of accidentally passing a check.
 */
const RANK: Record<Role, number> = {
  user: 0,
  leader: 1,
  contributor: 2,
  moderator: 3,
  admin: 4,
  super_admin: 5,
};

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

/** Numeric privilege level of a role; unknown roles rank lowest. */
export function rankOf(role: string | undefined | null): number {
  return role && isRole(role) ? RANK[role] : 0;
}

/** True if `role` has at least the privilege level of `min`. */
export function hasRole(role: string, min: Role): boolean {
  return rankOf(role) >= RANK[min];
}

/**
 * True if `actor` outranks `target`, i.e. may act on that account.
 *
 * Equal ranks deliberately fail: without this a moderator could suspend another
 * moderator, and an admin could demote a peer admin.
 */
export function outranks(actor: string, target: string): boolean {
  return rankOf(actor) > rankOf(target);
}

export function canModerate(role: string): boolean {
  return hasRole(role, "moderator");
}

export function isAdmin(role: string): boolean {
  return hasRole(role, "admin");
}
