/**
 * Primary site IA — shared by header and footer so links stay in sync.
 * PRD §4: Home, Jobs, Register, Login, Profile (when signed in), /admin/login (optional).
 *
 * Admin link in chrome: set `NEXT_PUBLIC_SHOW_ADMIN_NAV` to `1` or `true` so header/footer
 * show “Admin” → `/admin/login`. Leave unset in production unless operators need it.
 */
export const SITE_NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/jobs", label: "Jobs" },
  { href: "/#employers", label: "For employers" },
  { href: "/#contact", label: "Contact" },
] as const;

export const ADMIN_SITE_NAV_ENABLED =
  process.env.NEXT_PUBLIC_SHOW_ADMIN_NAV === "1" ||
  process.env.NEXT_PUBLIC_SHOW_ADMIN_NAV === "true";
