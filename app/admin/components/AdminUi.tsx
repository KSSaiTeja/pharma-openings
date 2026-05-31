import type { ReactNode } from "react";

import { siteAsset } from "@/app/components/site/paths";
import { cn } from "@/lib/utils";

export function AdminLogo({ className }: { className?: string }) {
  return (
    <img
      src={siteAsset("images/logo.png")}
      alt="PharmaOpenings"
      className={cn("po-admin-logo", className)}
      width={168}
      height={40}
    />
  );
}

export function AdminMain({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={cn("po-admin__main", className)}>{children}</main>;
}

export function AdminLoginShell({ children }: { children: ReactNode }) {
  return <div className="po-admin-login">{children}</div>;
}

export function AdminLoginCard({ children }: { children: ReactNode }) {
  return <div className="po-admin-login__card">{children}</div>;
}

export function AdminLoginHeader({ title, lead }: { title: string; lead: string }) {
  return (
    <header className="po-admin-login__header">
      <AdminLogo className="po-admin-login__logo" />
      <h1 className="po-admin-login__title">{title}</h1>
      <p className="po-admin-login__lead">{lead}</p>
    </header>
  );
}

export function AdminHeader({
  title,
  subtitle,
  actions,
  showLogo = true,
}: {
  title: string;
  subtitle?: string | null;
  actions?: ReactNode;
  showLogo?: boolean;
}) {
  return (
    <header className="po-admin-header">
      <div className="po-admin-header__start">
        {showLogo ? <AdminLogo className="po-admin-header__logo" /> : null}
        <div className="po-admin-header__text min-w-0">
          <h1 className="po-admin-header__title">{title}</h1>
          {subtitle ? <p className="po-admin-header__email">{subtitle}</p> : null}
        </div>
      </div>
      {actions ? <div className="po-admin-header__actions">{actions}</div> : null}
    </header>
  );
}

type AdminAlertProps = {
  variant: "success" | "error" | "info";
  children: ReactNode;
  className?: string;
};

export function AdminAlert({ variant, children, className }: AdminAlertProps) {
  return (
    <p
      className={cn("po-admin-alert", `po-admin-alert--${variant}`, className)}
      role={variant === "error" ? "alert" : "status"}
      aria-live={variant === "error" ? "assertive" : "polite"}
    >
      {children}
    </p>
  );
}

export function AdminSection({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("po-admin-section", className)}>{children}</div>;
}

export function AdminPanel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("po-admin-panel", className)}>{children}</div>;
}

export function AdminPanelField({
  children,
  className,
  size = "default",
}: {
  children: ReactNode;
  className?: string;
  size?: "default" | "sm" | "md" | "grow";
}) {
  const sizeClass =
    size === "sm" ? "po-admin-panel__field--sm" : size === "md" ? "po-admin-panel__field--md" : size === "grow" ? "po-admin-panel__field--grow" : "";
  return <div className={cn("po-admin-panel__field", sizeClass, className)}>{children}</div>;
}

export function AdminFilterLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label className="po-admin-label" htmlFor={htmlFor}>
      {children}
    </label>
  );
}

export function AdminFormField({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="po-admin-form__field">
      <label className="po-admin-form__label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}

export function AdminActions({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("po-admin-actions", className)}>{children}</div>;
}

export function AdminActionsGroup({ children }: { children: ReactNode }) {
  return <div className="po-admin-actions__group">{children}</div>;
}

export function AdminHint({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("po-admin-hint", className)}>{children}</p>;
}

export function AdminSelectBar({ children }: { children: ReactNode }) {
  return <div className="po-admin-select-bar">{children}</div>;
}

export function AdminTableWrap({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("po-admin-table-wrap", className)}>{children}</div>;
}

export function AdminPagination({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="po-admin-pagination">
      <span>{label}</span>
      <div className="po-admin-pagination__controls">{children}</div>
    </div>
  );
}

export function AdminCardList({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("po-admin-card-list", className)}>{children}</div>;
}

export function AdminCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("po-admin-card", className)}>{children}</div>;
}

export function AdminLoading({ message = "Loading…", className }: { message?: string; className?: string }) {
  return <p className={cn("po-admin-loading", className)}>{message}</p>;
}

export function AdminDetailGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <dl className={cn("po-admin-detail-grid", className)}>{children}</dl>;
}

export function AdminDetailItem({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("po-admin-detail-item", className)}>
      <dt className="po-admin-detail-item__label">{label}</dt>
      <dd className="po-admin-detail-item__value">{children}</dd>
    </div>
  );
}

/** Pass to DialogContent — pairs with admin.css dialog styles */
export const adminDialogClass = "po-admin-dialog";

export const adminTabsClass = {
  root: "po-admin-tabs",
  list: "po-admin-tabs__list",
  trigger: "po-admin-tabs__trigger",
  triggerIcon: "po-admin-tabs__trigger-icon",
  triggerTitle: "po-admin-tabs__trigger-title",
  triggerDesc: "po-admin-tabs__trigger-desc",
  badge: "po-admin-tabs__badge",
  content: "po-admin-tabs__content",
};
