import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Register | PharmaOpenings",
  description:
    "Create your PharmaOpenings candidate profile to apply for current openings and get matched with new opportunities.",
};

export default function RegisterLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="po-auth-layout-root">
      <Suspense fallback={null}>{children}</Suspense>
    </div>
  );
}
