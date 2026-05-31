"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useCandidate } from "@/src/context/CandidateContext";
import { getCandidateAvatarUrl } from "@/src/lib/profileDisplay";

import { HeaderAccountMenu } from "./HeaderAccountMenu";
import { HashScrollOnLoad } from "./HashScrollOnLoad";
import { NAV_SECTIONS } from "./navConfig";
import { SiteNavLink } from "./SiteNavLink";
import { UserAvatar } from "./UserAvatar";
import { siteAsset } from "./paths";
import { useNavActiveId } from "./useActiveNavSection";

function HeaderNav({
  activeId,
  onNavigate,
}: {
  activeId: string | null;
  onNavigate?: () => void;
}) {
  return (
    <nav className="po-header-nav" aria-label="Primary">
      <ul className="po-header-nav-list">
        {NAV_SECTIONS.map((item) => (
          <li key={item.id}>
            <SiteNavLink
              href={item.href}
              label={item.label}
              isActive={activeId === item.id}
              onNavigate={onNavigate}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function HeaderBar({
  activeId,
  showMobileToggle = false,
  mobileOpen = false,
  onOpenMobile,
}: {
  activeId: string | null;
  showMobileToggle?: boolean;
  mobileOpen?: boolean;
  onOpenMobile?: () => void;
}) {
  const { candidate, isAuthenticated, loading } = useCandidate();
  const avatarUrl = getCandidateAvatarUrl(candidate);
  const showMobileProfile =
    showMobileToggle && !loading && isAuthenticated && Boolean(candidate);

  return (
    <div className="outer-box po-header-bar">
      <figure className="logo-box pl_15">
        <Link href="/" className="po-logo-link">
          <img src={siteAsset("images/logo.png")} alt="PharmaOpenings" />
        </Link>
      </figure>

      <HeaderNav activeId={activeId} />

      <HeaderAccountMenu />

      {showMobileProfile ? (
        <Link href="/profile" className="po-header-mobile-avatar-link" aria-label="My profile">
          <UserAvatar name={candidate!.full_name} src={avatarUrl} size="sm" />
        </Link>
      ) : null}

      {showMobileToggle ? (
        <button
          type="button"
          className="po-header-mobile-toggle mobile-nav-toggler"
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          onClick={onOpenMobile}
        >
          <span className="icon-bar" />
          <span className="icon-bar" />
          <span className="icon-bar" />
        </button>
      ) : null}
    </div>
  );
}

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const openMobile = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    document.body.classList.toggle("mobile-menu-visible", mobileOpen);
    document.body.classList.toggle("po-mobile-nav-open", mobileOpen);
    return () => {
      document.body.classList.remove("mobile-menu-visible", "po-mobile-nav-open");
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobile();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeMobile]);

  const activeId = useNavActiveId();

  return (
    <>
      <HashScrollOnLoad />
      <header className="main-header header-style-one po-site-header">
        <div className="header-lower">
          <div className="auto-container">
            <HeaderBar
              activeId={activeId}
              showMobileToggle
              mobileOpen={mobileOpen}
              onOpenMobile={openMobile}
            />
          </div>
        </div>

        <div className="sticky-header po-sticky-header">
          <div className="auto-container">
            <HeaderBar
              activeId={activeId}
              showMobileToggle
              mobileOpen={mobileOpen}
              onOpenMobile={openMobile}
            />
          </div>
        </div>
      </header>

      <div className={`mobile-menu po-mobile-menu${mobileOpen ? " po-mobile-menu--open" : ""}`}>
        <button type="button" className="menu-backdrop" aria-label="Close menu" onClick={closeMobile} />
        <button type="button" className="close-btn" aria-label="Close menu" onClick={closeMobile}>
          <i className="fas fa-times" aria-hidden />
        </button>
        <nav className="menu-box">
          <div className="nav-logo">
            <Link href="/" onClick={closeMobile}>
              <img src={siteAsset("images/logo.png")} alt="PharmaOpenings" />
            </Link>
          </div>
          <div className="menu-outer">
            <ul className="navigation clearfix po-mobile-nav-list">
              {NAV_SECTIONS.map((item) => (
                <li key={item.id}>
                  <SiteNavLink
                    href={item.href}
                    label={item.label}
                    isActive={activeId === item.id}
                    onNavigate={closeMobile}
                    className="po-mobile-nav-link"
                  />
                </li>
              ))}
            </ul>
          </div>
          <div className="contact-info po-mobile-account">
            <h4>Account</h4>
            <HeaderAccountMenu variant="mobile" onNavigate={closeMobile} />
          </div>
        </nav>
      </div>
    </>
  );
}
