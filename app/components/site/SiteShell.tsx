"use client";

import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { SitePreloader } from "./SitePreloader";
type SiteShellProps = {
  children: React.ReactNode;
};

/** Routes that set their own top spacing (auth forms). */
function pageHandlesHeaderOffset(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/apply/")
  );
}

export function SiteShell({ children }: SiteShellProps) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  const isHome = pathname === "/";
  const isPartner = pathname === "/partner";
  const flushUnderHeader = isHome || isPartner || pageHandlesHeaderOffset(pathname);

  return (
    <div className="boxed_wrapper ltr">
      <SitePreloader />
      <SiteHeader />
      <div className={cn("po-site-main", flushUnderHeader && "po-site-main--flush")}>{children}</div>
      <SiteFooter />

      <div className="scroll-to-top">
        <svg className="scroll-top-inner" viewBox="-1 -1 102 102">
          <path d="M50,1 a49,49 0 0,1 0,98 a49,49 0 0,1 0,-98" />
        </svg>
      </div>
    </div>
  );
}
