export type NavSection = {
  id: string;
  label: string;
  href: string;
};

export const NAV_SECTIONS: NavSection[] = [
  { id: "about", label: "About", href: "/#about" },
  { id: "jobs", label: "Openings", href: "/jobs" },
  { id: "blog", label: "Blog", href: "/blog" },
  { id: "how-it-works", label: "How it works", href: "/#how-it-works" },
  { id: "contact", label: "Contact", href: "/contact" },
];

/** Fixed header + pill offset when scrolling to in-page sections. */
export const SITE_NAV_SCROLL_OFFSET = 108;

export function sectionIdFromHref(href: string): string | null {
  const i = href.indexOf("#");
  if (i === -1) return null;
  const id = href.slice(i + 1).split("?")[0];
  return id || null;
}

export function scrollToSection(sectionId: string, behavior: ScrollBehavior = "smooth") {
  const el = document.getElementById(sectionId);
  if (!el) return false;
  const top = el.getBoundingClientRect().top + window.scrollY - SITE_NAV_SCROLL_OFFSET;
  window.scrollTo({ top: Math.max(0, top), behavior });
  return true;
}
