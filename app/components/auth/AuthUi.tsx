import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

type AuthAlertProps = {
  variant?: "error" | "info" | "warning" | "success";
  children: ReactNode;
};

export function AuthAlert({ variant = "info", children }: AuthAlertProps) {
  return (
    <div className={`po-auth-alert po-auth-alert--${variant}`} role="alert" aria-live="assertive">
      {children}
    </div>
  );
}

type AuthFieldProps = {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
};

export function AuthField({ label, htmlFor, required, hint, children }: AuthFieldProps) {
  return (
    <div className="po-auth-field">
      <label htmlFor={htmlFor} className="po-auth-label">
        {label}
        {required ? <span className="po-auth-required">*</span> : null}
        {hint ? <span className="po-auth-label-hint">{hint}</span> : null}
      </label>
      {children}
    </div>
  );
}

export function AuthInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`po-auth-input${props.className ? ` ${props.className}` : ""}`} />;
}

export function AuthSelect({
  className,
  value,
  defaultValue,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  const resolved = value ?? defaultValue ?? "";
  const isPlaceholder = resolved === "";
  return (
    <select
      {...props}
      value={value}
      defaultValue={defaultValue}
      className={`po-auth-input po-auth-select${isPlaceholder ? " po-auth-select--placeholder" : ""}${className ? ` ${className}` : ""}`}
    />
  );
}

type AuthButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "accent";
};

export function AuthButton({ variant = "primary", className, type = "button", ...props }: AuthButtonProps) {
  return (
    <button
      type={type}
      {...props}
      className={`po-auth-btn po-auth-btn--${variant}${className ? ` ${className}` : ""}`}
    />
  );
}

export function AuthFooterLink({ children, href }: { children: ReactNode; href: string }) {
  return (
    <p className="po-auth-footer">
      {children}{" "}
      <Link href={href} className="po-auth-footer__link">
        {href === "/login" ? "Sign in" : href === "/register" ? "Create an account" : "Continue"}
      </Link>
    </p>
  );
}

export function AuthStepBadge({ step, total }: { step: number; total: number }) {
  return (
    <p className="po-auth-steps" aria-live="polite">
      Step <strong>{step}</strong> of {total}
    </p>
  );
}
