const ADMIN_RETURN_KEY = "admin_return";

function sanitizeAdminReturn(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const value = raw.trim();
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  if (value.startsWith("/admin/login")) return "/admin";
  return value;
}

export function getAdminReturnFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  return sanitizeAdminReturn(window.localStorage.getItem(ADMIN_RETURN_KEY));
}

export function setAdminReturn(path: string) {
  if (typeof window === "undefined") return;
  const safe = sanitizeAdminReturn(path);
  if (!safe) return;
  window.localStorage.setItem(ADMIN_RETURN_KEY, safe);
}

export function clearAdminReturn() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ADMIN_RETURN_KEY);
}

export function resolveAdminReturn(queryValue: string | null | undefined): string {
  return (
    sanitizeAdminReturn(queryValue) ??
    getAdminReturnFromStorage() ??
    "/admin"
  );
}
