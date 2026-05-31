import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | PharmaOpenings",
  description: "Sign in with mobile OTP to access your PharmaOpenings candidate account.",
};

export default function LoginLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="po-auth-layout-root">{children}</div>;
}
