import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import authMiddleware from "next-auth/middleware";

// // Site-wide HTTP Basic Auth gate. Active only when both env vars are set
// // (e.g. on the Railway staging deployment); local dev is unaffected.
// const BASIC_AUTH_USER = process.env.BASIC_AUTH_USER;
// const BASIC_AUTH_PASSWORD = process.env.BASIC_AUTH_PASSWORD;
//
// function checkBasicAuth(req: NextRequest): boolean {
//   const header = req.headers.get("authorization");
//   if (!header?.startsWith("Basic ")) return false;
//   let decoded: string;
//   try {
//     decoded = atob(header.slice(6));
//   } catch {
//     return false;
//   }
//   const separator = decoded.indexOf(":");
//   if (separator === -1) return false;
//   const user = decoded.slice(0, separator);
//   const password = decoded.slice(separator + 1);
//   return user === BASIC_AUTH_USER && password === BASIC_AUTH_PASSWORD;
// }

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  // if (BASIC_AUTH_USER && BASIC_AUTH_PASSWORD && !checkBasicAuth(req)) {
  //   return new NextResponse("Authentication required", {
  //     status: 401,
  //     headers: { "WWW-Authenticate": 'Basic realm="Restricted"' },
  //   });
  // }

  // Wizard pages additionally require a next-auth session; /auth-relay must
  // remain public (the popup lands there).
  const { pathname } = req.nextUrl;
  if (pathname === "/create-agent" || pathname.startsWith("/create-agent/")) {
    return (authMiddleware as any)(req, event);
  }

  return NextResponse.next();
}

export const config = {
  // Everything goes through the basic-auth gate except build assets and the
  // health endpoint (Railway's healthcheck must get a 200).
  matcher: ["/((?!api/health|_next/static|_next/image|favicon.ico).*)"],
};
