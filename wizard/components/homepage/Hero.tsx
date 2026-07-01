"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export default function Hero() {
  const { status } = useSession();
  const signedIn = status === "authenticated";

  return (
    <section
      className="relative overflow-hidden py-24 md:py-32"
      style={{
        background:
          "radial-gradient(ellipse 80% 50% at 50% 0%, #3B1C13 0%, transparent 70%)",
      }}
    >
      <div className="mx-auto max-w-3xl px-6 text-center">
        <span className="inline-block rounded-full border border-portal-border bg-portal-surface2 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-portal-muted">
          Powered by SecretVM confidential compute
        </span>

        <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-portal-text md:text-6xl">
          Forge your AI agent.
          <br />
          <span className="text-portal-accent">Own it completely.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-portal-muted">
          SecretForge deploys your AI agent inside a private confidential enclave.
          Your API keys, your conversations, your connected tools — sealed inside
          your VM. Not even we can read them.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          {signedIn ? (
            <Link
              href="/create-agent"
              className="inline-flex items-center gap-2 rounded-md bg-portal-accent px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            >
              Launch wizard →
            </Link>
          ) : (
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 rounded-md bg-portal-accent px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            >
              Get started — Sign in
            </Link>
          )}
          <a
            href="#how-it-works"
            className="text-sm text-portal-muted underline-offset-4 transition-colors hover:text-portal-text hover:underline"
          >
            See how it works ↓
          </a>
        </div>
      </div>
    </section>
  );
}
