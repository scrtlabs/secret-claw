"use client";

import { useEffect } from "react";

// Landing page for the Google OAuth popup flow.
// NextAuth redirects here after successful auth; we post a message to the
// opener (the main window) and close the popup.
export default function AuthRelayPage() {
  useEffect(() => {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({ type: "GOOGLE_AUTH_SUCCESS" }, window.location.origin);
      window.close();
    } else {
      // Landed here directly (not as a popup) — go home.
      window.location.replace("/");
    }
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-portal-bg">
      <p className="text-sm text-portal-text/50">Signing in…</p>
    </div>
  );
}
