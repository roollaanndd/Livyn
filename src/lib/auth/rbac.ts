export const ROLES = ["user", "contributor", "moderator", "admin", "super_admin"] as const;
export type Role = (typeof ROLES)[number];

const RANK: Record<Role, number> = {
  user: 0,
  contributor: 1,
  moderator: 2,
  admin: 3,
  super_admin: 4,
};

/** True if `role` has at least the privilege level of `min`. */
export function hasRole(role: string, min: Role): boolean {
  const r = RANK[role as Role];
  return r !== undefined && r >= RANK[min];
}

export function canModerate(role: string): boolean {
  return hasRole(role, "moderator");
}

export function isAdmin(role: string): boolean {
  return hasRole(role, "admin");
}
