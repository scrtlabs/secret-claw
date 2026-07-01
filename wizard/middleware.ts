export { default } from "next-auth/middleware";

export const config = {
  // Protect wizard pages; /auth-relay must remain public (the popup lands there).
  matcher: ["/create-agent", "/create-agent/:path*"],
};
