"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { useCandidate } from "@/src/context/CandidateContext";

import { ADMIN_SITE_NAV_ENABLED, SITE_NAV_LINKS } from "./site-nav";

function LogoMark() {
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#6d6ae8] to-[#8b86ef] shadow-sm ring-2 ring-white/40"
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 text-white"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M12 4v16M8 8h8M8 16h8" />
      </svg>
    </span>
  );
}

function navLinkClass(active: boolean) {
  return active
    ? "text-sm font-semibold text-neutral-900"
    : "text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-800";
}

function primaryNavActive(href: string, pathname: string | null) {
  if (!pathname) return false;
  if (href === "/jobs") return pathname === "/jobs" || pathname.startsWith("/jobs/");
  if (href === "/") return pathname === "/";
  return false;
}

export function FloatingNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { candidate, isAuthenticated, loading: authLoading, logout } = useCandidate();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <header className="pointer-events-none fixed left-0 right-0 top-5 z-50 px-4 sm:top-6">
      <div className="pointer-events-auto relative mx-auto w-full max-w-[1100px]">
        <nav
          className="flex w-full items-center justify-between gap-3 rounded-full border border-white/70 bg-white/80 px-4 py-2.5 shadow-[0_8px_32px_rgba(15,23,42,0.08)] backdrop-blur-md sm:gap-6 sm:px-7 sm:py-3"
          aria-label="Main"
        >
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5 text-neutral-900"
            onClick={close}
          >
            <LogoMark />
            <span className="text-sm font-semibold tracking-[0.12em] text-neutral-800 sm:text-[0.8125rem]">
              PHARMAOPENINGS
            </span>
          </Link>

          <div className="hidden flex-1 items-center justify-center md:flex">
            <ul className="flex items-center gap-8 lg:gap-10">
              {SITE_NAV_LINKS.map(({ href, label }) => {
                const active = primaryNavActive(href, pathname);
                return (
                  <li key={href}>
                    <Link href={href} className={navLinkClass(active)}>
                      {label}
                    </Link>
                  </li>
                );
              })}
              {ADMIN_SITE_NAV_ENABLED ? (
                <li>
                  <Link
                    href="/admin/login"
                    className={navLinkClass(pathname === "/admin/login")}
                  >
                    Admin
                  </Link>
                </li>
              ) : null}
            </ul>
          </div>

          <div className="hidden shrink-0 items-center gap-3 md:flex md:gap-4">
            {authLoading ? (
              <span
                className="h-4 w-20 animate-pulse rounded-full bg-[var(--color-po-lavender-deep)]"
                aria-hidden
              />
            ) : null}
            {!authLoading && !isAuthenticated ? (
              <>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-[var(--color-po-navy)] transition-colors hover:text-[var(--color-po-violet)]"
                  onClick={close}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-semibold text-[var(--color-po-navy)] transition-colors hover:text-[var(--color-po-violet)]"
                  onClick={close}
                >
                  Register
                </Link>
                <Link
                  href="/jobs"
                  className="rounded-full bg-[#1d1d1d] px-5 py-2 text-sm font-medium text-white shadow-[inset_0px_1px_2px_rgba(255,255,255,0.2),inset_0px_-2px_4px_rgba(0,0,0,0.35)] transition-[filter] hover:brightness-110 active:brightness-95"
                  onClick={close}
                >
                  Browse jobs
                </Link>
              </>
            ) : null}
            {!authLoading && isAuthenticated ? (
              <>
                <Link
                  href="/profile"
                  className="max-w-[200px] truncate text-sm font-semibold text-[var(--color-po-navy)] transition-colors hover:text-[var(--color-po-violet)]"
                  title={candidate?.full_name ?? "Profile"}
                  onClick={close}
                >
                  {candidate?.full_name ?? "Profile"}
                </Link>
                <button
                  type="button"
                  className="text-sm font-semibold text-[var(--color-po-muted)] transition-colors hover:text-[var(--color-po-navy)]"
                  onClick={() => {
                    logout();
                    close();
                    router.refresh();
                  }}
                >
                  Sign out
                </button>
              </>
            ) : null}
          </div>

          <div className="hidden shrink-0 items-center gap-3 sm:flex md:hidden">
            {authLoading ? (
              <span
                className="h-4 w-16 animate-pulse rounded-full bg-[var(--color-po-lavender-deep)]"
                aria-hidden
              />
            ) : null}
            {!authLoading && !isAuthenticated ? (
              <>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-[var(--color-po-navy)] transition-colors hover:text-[var(--color-po-violet)]"
                  onClick={close}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-semibold text-[var(--color-po-navy)] transition-colors hover:text-[var(--color-po-violet)]"
                  onClick={close}
                >
                  Register
                </Link>
                <Link
                  href="/jobs"
                  className="rounded-full bg-[#1d1d1d] px-5 py-2 text-sm font-medium text-white shadow-[inset_0px_1px_2px_rgba(255,255,255,0.2),inset_0px_-2px_4px_rgba(0,0,0,0.35)] transition-[filter] hover:brightness-110 active:brightness-95"
                  onClick={close}
                >
                  Browse jobs
                </Link>
              </>
            ) : null}
            {!authLoading && isAuthenticated ? (
              <>
                <Link
                  href="/profile"
                  className="max-w-[140px] truncate text-sm font-semibold text-[var(--color-po-navy)] transition-colors hover:text-[var(--color-po-violet)]"
                  title={candidate?.full_name ?? "Profile"}
                  onClick={close}
                >
                  {candidate?.full_name ?? "Profile"}
                </Link>
                <button
                  type="button"
                  className="text-sm font-semibold text-[var(--color-po-muted)] transition-colors hover:text-[var(--color-po-navy)]"
                  onClick={() => {
                    logout();
                    close();
                    router.refresh();
                  }}
                >
                  Sign out
                </button>
              </>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-2 md:hidden">
            {!authLoading && !isAuthenticated ? (
              <Link
                href="/jobs"
                className="rounded-full bg-[#1d1d1d] px-4 py-2 text-xs font-medium text-white shadow-[inset_0px_1px_2px_rgba(255,255,255,0.2),inset_0px_-2px_4px_rgba(0,0,0,0.35)]"
                onClick={close}
              >
                Browse jobs
              </Link>
            ) : null}
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200/80 bg-white/60 text-neutral-700"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                {open ? (
                  <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </nav>

        {open ? (
          <div
            id="mobile-nav"
            className="absolute left-0 right-0 top-[calc(100%+0.75rem)] rounded-3xl border border-white/80 bg-white/95 p-4 shadow-[0_16px_48px_rgba(15,23,42,0.12)] backdrop-blur-lg md:hidden"
          >
            <ul className="flex flex-col gap-1">
              {SITE_NAV_LINKS.map(({ href, label }) => {
                const active = primaryNavActive(href, pathname);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`block rounded-xl px-3 py-2.5 hover:bg-neutral-50 ${active ? "font-semibold text-neutral-900" : "font-medium text-neutral-600 hover:text-neutral-900"}`}
                      onClick={close}
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
              {ADMIN_SITE_NAV_ENABLED ? (
                <li>
                  <Link
                    href="/admin/login"
                    className={`block rounded-xl px-3 py-2.5 hover:bg-neutral-50 ${pathname === "/admin/login" ? "font-semibold text-neutral-900" : "font-medium text-neutral-600 hover:text-neutral-900"}`}
                    onClick={close}
                  >
                    Admin
                  </Link>
                </li>
              ) : null}
              <li className="mt-2 border-t border-neutral-200/70 pt-2">
                {authLoading ? (
                  <span className="block px-3 py-2 text-sm text-neutral-500">Loading…</span>
                ) : null}
                {!authLoading && !isAuthenticated ? (
                  <div className="flex flex-col gap-1">
                    <Link
                      href="/login"
                      className="block rounded-xl px-3 py-2.5 font-semibold text-[var(--color-po-navy)] hover:bg-neutral-50"
                      onClick={close}
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="block rounded-xl px-3 py-2.5 font-semibold text-[var(--color-po-navy)] hover:bg-neutral-50"
                      onClick={close}
                    >
                      Register
                    </Link>
                  </div>
                ) : null}
                {!authLoading && isAuthenticated ? (
                  <div className="flex flex-col gap-1">
                    <Link
                      href="/profile"
                      className="block truncate rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--color-po-navy)] hover:bg-neutral-50"
                      title={candidate?.full_name ?? "Profile"}
                      onClick={close}
                    >
                      {candidate?.full_name ?? "Profile"}
                    </Link>
                    <button
                      type="button"
                      className="block w-full rounded-xl px-3 py-2.5 text-left font-semibold text-[var(--color-po-navy)] hover:bg-neutral-50"
                      onClick={() => {
                        logout();
                        close();
                        router.refresh();
                      }}
                    >
                      Sign out
                    </button>
                  </div>
                ) : null}
              </li>
            </ul>
          </div>
        ) : null}
      </div>
    </header>
  );
}
