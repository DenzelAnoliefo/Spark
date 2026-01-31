import { NextResponse } from "next/server";

// Auth routing is handled client-side via AuthProvider + useAuth
// Middleware only protects routes that need server-side redirect (optional)
const publicPaths = ["/login"];

export function middleware(request) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
