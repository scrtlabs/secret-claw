"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

function GoogleRedirect() {
  const params = useSearchParams();

  useEffect(() => {
    const callbackUrl =
      params.get("callbackUrl") ?? `${window.location.origin}/auth-relay`;

    fetch("/api/auth/csrf")
      .then((r) => r.json())
      .then(({ csrfToken }: { csrfToken: string }) => {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = "/api/auth/signin/google";

        for (const [name, value] of Object.entries({ csrfToken, callbackUrl })) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = name;
          input.value = value;
          form.appendChild(input);
        }

        document.body.appendChild(form);
        form.submit();
      });
  }, [params]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-portal-bg">
      <p className="text-sm text-portal-text/50">Connecting to Google…</p>
    </div>
  );
}

export default function GoogleInitiatePage() {
  return (
    <Suspense>
      <GoogleRedirect />
    </Suspense>
  );
}
