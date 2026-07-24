// Role/permission checks for community features.
// Kept intentionally simple: everything asks "can this user do X" — never
// leak whether the user is admin/leader/regular through UI branching.

const LEADER_ROLES = new Set(["leader", "admin", "super_admin"]);

export function isLeader(role: string | undefined): boolean {
  return !!role && LEADER_ROLES.has(role);
}

export function isAdmin(role: string | undefined): boolean {
  return role === "admin" || role === "super_admin";
}

// A pastoral circle gets higher member limits + weekly missions + broadcasts.
// Friend circles are peer-to-peer with no leader authority.
export function circleTypeFor(role: string | undefined): "friend" | "pastoral" {
  return isLeader(role) ? "pastoral" : "friend";
}

export function memberLimitFor(type: "friend" | "pastoral"): number {
  return type === "pastoral" ? 100 : 15;
}

export function maxCirclesFor(role: string | undefined): number {
  return isLeader(role) ? 20 : 2;
}
