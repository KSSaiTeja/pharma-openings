import type { CandidateRow } from "@/types/database.types";

/** Optional until `avatar_url` exists on `candidates`; safe to read when added. */
export type CandidateWithAvatar = CandidateRow & {
  avatar_url?: string | null;
};

export function getCandidateAvatarUrl(candidate: CandidateRow | null): string | null {
  if (!candidate) return null;
  const url = (candidate as CandidateWithAvatar).avatar_url;
  return typeof url === "string" && url.trim() ? url.trim() : null;
}

export function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export function getDisplayName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return "My profile";
  const first = trimmed.split(/\s+/)[0];
  return first ?? trimmed;
}

export function avatarAccentColor(seed: string): string {
  const palette = ["#5a8f1a", "#3d6b4f", "#2f6f8f", "#6b5b95", "#b85c38", "#4a7c59"];
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length] ?? palette[0];
}
