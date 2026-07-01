"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export function useGooglePopup(callbackUrl = "/create-agent"): [() => void, boolean] {
  const router = useRouter();
  const { update } = useSession();
  const [isPending, setIsPending] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  const open = useCallback(() => {
    if (cleanupRef.current) cleanupRef.current();

    const w = 500, h = 620;
    const left = Math.round(window.screenX + (window.outerWidth - w) / 2);
    const top = Math.round(window.screenY + (window.outerHeight - h) / 2);

    const authRelayUrl = `${window.location.origin}/auth-relay`;
    const popup = window.open(
      `/auth/google?callbackUrl=${encodeURIComponent(authRelayUrl)}`,
      "GoogleSignIn",
      `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`,
    );

    setIsPending(true);

    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      clearInterval(closedPoll);
      setIsPending(false);
      cleanupRef.current = null;
    };

    const onMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "GOOGLE_AUTH_SUCCESS") return;
      cleanup();
      await update();
      router.push(callbackUrl);
      router.refresh();
    };

    window.addEventListener("message", onMessage);

    const closedPoll = setInterval(() => {
      if (popup?.closed) cleanup();
    }, 500);

    cleanupRef.current = cleanup;
  }, [router, update, callbackUrl]);

  return [open, isPending];
}
