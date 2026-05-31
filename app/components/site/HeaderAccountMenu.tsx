"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Briefcase, ChevronRight, LogOut, User } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCandidate } from "@/src/context/CandidateContext";
import {
  getCandidateAvatarUrl,
  getDisplayName,
} from "@/src/lib/profileDisplay";

import { UserAvatar } from "./UserAvatar";

type HeaderAccountMenuProps = {
  onNavigate?: () => void;
  variant?: "header" | "mobile";
};

function AccountTriggerSkeleton() {
  return (
    <div className="po-header-account-skeleton" aria-busy="true" aria-label="Loading account">
      <span className="po-header-account-skeleton__avatar" />
      <span className="po-header-account-skeleton__lines">
        <span className="po-header-account-skeleton__line" />
        <span className="po-header-account-skeleton__line po-header-account-skeleton__line--short" />
      </span>
    </div>
  );
}

function MenuRow({
  icon: Icon,
  label,
  href,
  onClick,
  tone = "default",
}: {
  icon: typeof User;
  label: string;
  href?: string;
  onClick?: () => void;
  tone?: "default" | "danger";
}) {
  const content = (
    <>
      <span className={`po-header-account-menu-icon${tone === "danger" ? " is-danger" : ""}`}>
        <Icon size={18} strokeWidth={2} aria-hidden />
      </span>
      <span className="po-header-account-menu-label">{label}</span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        onClick={onClick}
        className={`po-header-account-menu-row${tone === "danger" ? " is-danger" : ""}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={`po-header-account-menu-row${tone === "danger" ? " is-danger" : ""}`}
      onClick={onClick}
    >
      {content}
    </button>
  );
}

export function HeaderAccountMenu({ onNavigate, variant = "header" }: HeaderAccountMenuProps) {
  const router = useRouter();
  const { candidate, isAuthenticated, loading, logout } = useCandidate();

  const finish = () => onNavigate?.();

  const handleLogout = () => {
    logout();
    finish();
    router.push("/");
  };

  if (loading) {
    if (variant === "mobile") {
      return <AccountTriggerSkeleton />;
    }
    return (
      <div className="po-header-actions po-header-actions--loading">
        <AccountTriggerSkeleton />
      </div>
    );
  }

  if (!isAuthenticated || !candidate) {
    if (variant === "mobile") {
      return (
        <ul className="po-mobile-account-guest">
          <li>
            <Link href="/login" onClick={finish} className="po-mobile-account-link po-mobile-account-link--ghost">
              Log in
            </Link>
          </li>
          <li>
            <Link
              href="/register"
              onClick={finish}
              className="theme-btn btn-one po-mobile-register-btn"
            >
              Register
            </Link>
          </li>
        </ul>
      );
    }

    return (
      <div className="po-header-actions">
        <Link href="/login" className="po-header-login">
          Log in
        </Link>
        <Link href="/register" className="theme-btn btn-one po-header-register">
          Register
        </Link>
      </div>
    );
  }

  const avatarUrl = getCandidateAvatarUrl(candidate);
  const displayName = getDisplayName(candidate.full_name);

  if (variant === "mobile") {
    return (
      <div className="po-mobile-account-user">
        <Link href="/profile" onClick={finish} className="po-mobile-account-profile">
          <UserAvatar name={candidate.full_name} src={avatarUrl} size="lg" />
          <span className="po-mobile-account-profile-text">
            <span className="po-mobile-account-name">{candidate.full_name}</span>
            <span className="po-mobile-account-email">{candidate.email}</span>
          </span>
          <ChevronRight className="po-mobile-account-chevron" size={20} strokeWidth={2} aria-hidden />
        </Link>
        <div className="po-mobile-account-actions">
          <Link href="/profile" onClick={finish} className="po-mobile-account-chip po-mobile-account-chip--primary">
            <User size={18} strokeWidth={2} aria-hidden />
            My profile
          </Link>
          <Link href="/jobs" onClick={finish} className="po-mobile-account-chip">
            <Briefcase size={18} strokeWidth={2} aria-hidden />
            Browse jobs
          </Link>
          <button
            type="button"
            className="po-mobile-account-chip po-mobile-account-chip--logout"
            onClick={handleLogout}
          >
            <LogOut size={18} strokeWidth={2} aria-hidden />
            Log out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="po-header-actions po-header-actions--user">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className="po-header-account-trigger" aria-label="Account menu">
            <UserAvatar name={candidate.full_name} src={avatarUrl} size="sm" />
            <span className="po-header-account-trigger-text">
              <span className="po-header-account-name">{displayName}</span>
              <span className="po-header-account-sub">Account</span>
            </span>
            <ChevronRight className="po-header-account-chevron" size={16} strokeWidth={2.25} aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="po-header-account-dropdown" sideOffset={12}>
          <div className="po-header-account-dropdown-banner">
            <UserAvatar name={candidate.full_name} src={avatarUrl} size="md" />
            <div className="po-header-account-dropdown-meta">
              <p className="po-header-account-dropdown-name">{candidate.full_name}</p>
              <p className="po-header-account-dropdown-email">{candidate.email}</p>
            </div>
          </div>
          <div className="po-header-account-dropdown-body">
            <MenuRow icon={User} label="My profile" href="/profile" onClick={finish} />
            <MenuRow icon={Briefcase} label="Browse jobs" href="/jobs" onClick={finish} />
            <div className="po-header-account-dropdown-sep" role="separator" />
            <MenuRow icon={LogOut} label="Log out" tone="danger" onClick={handleLogout} />
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
