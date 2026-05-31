import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Briefcase, FileText, LayoutDashboard, LogOut } from "lucide-react";
import type { ReactNode } from "react";

import { AdminLogo, AdminMain } from "@/app/admin/components/AdminUi";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AdminShellProps = {
  children: ReactNode;
  sessionEmail: string;
  onLogout: () => void;
};

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
};

const MAIN_NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/blog", label: "Blog", icon: FileText },
];

const INSIGHTS_NAV: NavItem[] = [
  { href: "/admin/analytics", label: "Website traffic", icon: BarChart3, exact: true },
];

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const Icon = item.icon;
  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <li>
      <Link
        href={item.href}
        className={cn("po-admin-shell__nav-link", active && "is-active")}
        aria-current={active ? "page" : undefined}
      >
        <Icon className="po-admin-shell__nav-icon" aria-hidden />
        {item.label}
      </Link>
    </li>
  );
}

export function AdminShell({ children, sessionEmail, onLogout }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="po-admin-shell">
      <aside className="po-admin-shell__sidebar" aria-label="Admin navigation">
        <div className="po-admin-shell__brand">
          <Link href="/admin" className="po-admin-shell__brand-link">
            <AdminLogo className="po-admin-shell__logo" />
          </Link>
          <p className="po-admin-shell__email">{sessionEmail}</p>
        </div>

        <nav className="po-admin-shell__nav">
          <p className="po-admin-shell__nav-label">Manage</p>
          <ul className="po-admin-shell__nav-list">
            {MAIN_NAV.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </ul>

          <p className="po-admin-shell__nav-label">Insights</p>
          <ul className="po-admin-shell__nav-list">
            {INSIGHTS_NAV.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </ul>
        </nav>

        <div className="po-admin-shell__sidebar-foot">
          <Link href="/jobs" className="po-admin-shell__nav-link po-admin-shell__nav-link--muted">
            <Briefcase className="po-admin-shell__nav-icon" aria-hidden />
            View site
          </Link>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="po-admin-btn-outline po-admin-shell__logout"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Sign out
          </Button>
        </div>
      </aside>

      <div className="po-admin-shell__content">
        <AdminMain>{children}</AdminMain>
      </div>
    </div>
  );
}
