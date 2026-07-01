"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export function useGooglePopup(callbackUrl = "/create-agent") {
  const router = useRouter();
  const { update } = useSession();

  return useCallback(() => {
    const w = 500, h = 620;
    const left = Math.round(window.screenX + (window.outerWidth - w) / 2);
    const top = Math.round(window.screenY + (window.outerHeight - h) / 2);

    const authRelayUrl = `${window.location.origin}/auth-relay`;
    const popup = window.open(
      `/auth/google?callbackUrl=${encodeURIComponent(authRelayUrl)}`,
      "GoogleSignIn",
      `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`,
    );

    const onMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "GOOGLE_AUTH_SUCCESS") return;

      window.removeEventListener("message", onMessage);
      clearInterval(closedPoll);

      // Re-fetch the session now that the cookie exists.
      await update();
      router.push(callbackUrl);
      router.refresh();
    };

    window.addEventListener("message", onMessage);

    // Clean up listener if the user closes the popup manually.
    const closedPoll = setInterval(() => {
      if (popup?.closed) {
        clearInterval(closedPoll);
        window.removeEventListener("message", onMessage);
      }
    }, 500);
  }, [router, update, callbackUrl]);
}
