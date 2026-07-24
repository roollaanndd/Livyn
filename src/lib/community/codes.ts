// Human-friendly join/invite codes.
// Alphabet skips 0/O/1/I/L to avoid ambiguity when printed on paper (e.g. warta jemaat).
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function random(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
  }
  return out;
}

// Format: LIVYN-XXXX (invite friend) — short enough to type
export function generateFriendInviteCode(): string {
  return `LVN-${random(4)}`;
}

// Format: CHURCH-CIRCLE-XXXX (circle join) — church codes printed on bulletins
export function generateCircleJoinCode(): string {
  return `${random(4)}-${random(4)}`;
}
