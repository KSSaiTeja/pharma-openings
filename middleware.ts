import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Ensure /blog is never treated as a permanently cached redirect to the homepage. */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/blog" || pathname.startsWith("/blog/")) {
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
    return response;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/blog", "/blog/:path*"],
};
