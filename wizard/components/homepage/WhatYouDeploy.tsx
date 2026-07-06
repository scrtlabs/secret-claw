"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

type Runtime = "openclaw" | "hermes";
type Tier = "secret" | "byo";

interface Option<T extends string> {
  id: T;
  name: string;
  tag: string;
  body: string;
}

const RUNTIMES: Option<Runtime>[] = [
  {
    id: "openclaw",
    name: "OpenClaw",
    tag: "Autonomous claw",
    body:
      "A full agent runtime — reads your email, runs scheduled routines, takes actions on your behalf.",
  },
  {
    id: "hermes",
    name: "Hermes",
    tag: "Lean agent runtime",
    body:
      "A lightweight Nous Hermes agent. Same private enclave, a smaller, faster footprint.",
  },
];

const MODELS: Option<Tier>[] = [
  {
    id: "secret",
    name: "SecretAI",
    tag: "In-enclave inference",
    body:
      "Attested open source models running inside confidential compute. Your prompts never leave the VM.",
  },
  {
    id: "byo",
    name: "Bring your own key",
    tag: "Anthropic / OpenAI",
    body:
      "Use Claude or GPT with your own API key. Best-in-class models, sealed inside your agent's config.",
  },
];

function OptionCard({
  name,
  tag,
  body,
  selected,
  onClick,
}: {
  name: string;
  tag: string;
  body: string;
  selected: boolean;
  onClick: () => void;
}) {
  const stateClasses = selected
    ? "border-portal-accent bg-portal-surface2 ring-1 ring-portal-accent"
    : "border-portal-border bg-portal-surface hover:border-portal-borderStrong";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex flex-col rounded-xl border p-5 text-left transition-colors ${stateClasses}`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-base font-semibold text-portal-text">{name}</h3>
        <span className="text-[11px] uppercase tracking-wider text-portal-accent">
          {tag}
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-portal-muted">{body}</p>
    </button>
  );
}

function OptionGroup<T extends string>({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: Option<T>[];
  selected: T | null;
  onSelect: (id: T) => void;
}) {
  return (
    <div>
      <p className="mb-4 text-xs font-medium uppercase tracking-widest text-portal-muted">
        {label}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {options.map((opt) => (
          <OptionCard
            key={opt.id}
            name={opt.name}
            tag={opt.tag}
            body={opt.body}
            selected={selected === opt.id}
            onClick={() => onSelect(opt.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default function WhatYouDeploy() {
  const [runtime, setRuntime] = useState<Runtime | null>(null);
  const [tier, setTier] = useState<Tier | null>(null);
  const { status } = useSession();
  const signedIn = status === "authenticated";

  const ready = runtime !== null && tier !== null;
  const wizardUrl = ready
    ? `/create-agent?runtime=${runtime}&tier=${tier}`
    : "/create-agent";
  const href = signedIn
    ? wizardUrl
    : `/sign-in?callbackUrl=${encodeURIComponent(wizardUrl)}`;

  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-portal-text">
            What you can deploy
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-portal-muted">
            Pick a runtime, then a model. Your choice ships into your own
            confidential SecretVM.
          </p>
        </div>

        <div className="flex flex-col gap-10">
          <OptionGroup
            label="1 · Choose a runtime"
            options={RUNTIMES}
            selected={runtime}
            onSelect={setRuntime}
          />
          <OptionGroup
            label="2 · Choose a model"
            options={MODELS}
            selected={tier}
            onSelect={setTier}
          />
        </div>

        <div className="mt-12 flex flex-col items-center gap-3">
          <Link
            href={href}
            aria-disabled={!ready}
            onClick={(e) => { if (!ready) e.preventDefault(); }}
            className={`inline-flex items-center gap-2 rounded-md bg-portal-accent px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 ${!ready ? "pointer-events-none opacity-40" : ""}`}
          >
            {signedIn
              ? ready ? "Deploy →" : "Select options above"
              : ready ? "Sign in & deploy →" : "Sign in with Google"}
          </Link>
          <p className="text-sm text-portal-muted">
            {ready
              ? "We'll take you to the wizard with this combination pre-selected."
              : "Select a runtime and a model to continue."}
          </p>
        </div>
      </div>
    </section>
  );
}
