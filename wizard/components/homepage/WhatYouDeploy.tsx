"use client";

import { useGoogleSignIn } from "@/components/ui/GoogleSignInButton";

interface DeployCard {
  name: string;
  tag: string;
  body: string;
  // Pre-selection carried into the wizard via the post-sign-in redirect.
  query: string;
}

const RUNTIMES: DeployCard[] = [
  {
    name: "OpenClaw",
    tag: "Autonomous claw",
    body:
      "A full agent runtime — reads your email, runs scheduled routines, takes actions on your behalf.",
    query: "runtime=openclaw",
  },
  {
    name: "Hermes",
    tag: "Lean agent runtime",
    body:
      "A lightweight Nous Hermes agent. Same private enclave, a smaller, faster footprint.",
    query: "runtime=hermes",
  },
];

const MODELS: DeployCard[] = [
  {
    name: "SecretAI",
    tag: "In-enclave inference",
    body:
      "Attested open models running inside confidential compute. Your prompts never leave the VM.",
    query: "tier=secret",
  },
  {
    name: "Bring your own key",
    tag: "Anthropic / OpenAI",
    body:
      "Use Claude or GPT with your own API key. Best-in-class models, sealed inside your agent's config.",
    query: "tier=byo",
  },
];

function DeployGroup({
  label,
  cards,
  onPick,
}: {
  label: string;
  cards: DeployCard[];
  onPick: (query: string) => void;
}) {
  return (
    <div>
      <p className="mb-4 text-xs font-medium uppercase tracking-widest text-portal-muted">
        {label}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <button
            key={card.name}
            type="button"
            onClick={() => onPick(card.query)}
            className="group flex flex-col rounded-xl border border-portal-border bg-portal-surface p-5 text-left transition-colors hover:border-portal-accent"
          >
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-base font-semibold text-portal-text">
                {card.name}
              </h3>
              <span className="text-[11px] uppercase tracking-wider text-portal-accent">
                {card.tag}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-portal-muted">
              {card.body}
            </p>
            <span className="mt-4 text-sm font-medium text-portal-muted transition-colors group-hover:text-portal-accent">
              Deploy this →
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function WhatYouDeploy() {
  const signIn = useGoogleSignIn();

  // Card click → Google sign-in → land in the wizard with this choice
  // pre-selected. Sign-in stays the front door; the selection rides along in
  // the redirect URL.
  function pick(query: string) {
    signIn({ redirectTo: `/create-agent?${query}` });
  }

  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-portal-text">
            What you can deploy
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-portal-muted">
            Pick a runtime and a model. Every combination ships into your own
            confidential SecretVM.
          </p>
        </div>

        <div className="flex flex-col gap-10">
          <DeployGroup label="Runtime" cards={RUNTIMES} onPick={pick} />
          <DeployGroup label="Model" cards={MODELS} onPick={pick} />
        </div>
      </div>
    </section>
  );
}
