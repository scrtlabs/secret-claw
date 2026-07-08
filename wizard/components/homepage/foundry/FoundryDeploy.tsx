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
  /** how this choice reads once forged into the sealed manifest */
  manifest: string;
}

const RUNTIMES: Option<Runtime>[] = [
  {
    id: "openclaw",
    name: "OpenClaw",
    tag: "Autonomous",
    body:
      "A full agent runtime — reads your email, runs scheduled routines, takes actions on your behalf.",
    manifest: "OpenClaw",
  },
  {
    id: "hermes",
    name: "Hermes",
    tag: "Lean",
    body:
      "A lightweight Nous Hermes agent. Same private enclave, a smaller, faster footprint.",
    manifest: "Hermes",
  },
];

const MODELS: Option<Tier>[] = [
  {
    id: "secret",
    name: "SecretAI",
    tag: "In-enclave",
    body:
      "Attested open source models running inside confidential compute. Your prompts never leave the VM.",
    manifest: "SecretAI · attested",
  },
  {
    id: "byo",
    name: "Bring your own key",
    tag: "Claude / GPT",
    body:
      "Use Claude or GPT with your own API key. Best-in-class models, sealed inside your agent's config.",
    manifest: "Claude · BYO key",
  },
];

function OptionCard<T extends string>({
  opt,
  selected,
  onClick,
}: {
  opt: Option<T>;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="fgopt"
    >
      <span className="fgopt__check" aria-hidden="true">✓</span>
      <span className="fgopt__top">
        <span className="fgopt__name">{opt.name}</span>
        <span className="fgopt__tag">{opt.tag}</span>
      </span>
      <span className="fgopt__body">{opt.body}</span>
    </button>
  );
}

function ManifestRow({
  k,
  value,
  pending,
  ok,
}: {
  k: string;
  value: string;
  pending?: boolean;
  ok?: boolean;
}) {
  return (
    <div className="man__row">
      <span className="man__k">{k}</span>
      <span className={`man__v${pending ? " man__v--pending" : ""}`}>
        {value}
        {ok && !pending ? <span className="man__ok"> ✓</span> : null}
      </span>
    </div>
  );
}

export default function FoundryDeploy() {
  const [runtime, setRuntime] = useState<Runtime | null>(null);
  const [tier, setTier] = useState<Tier | null>(null);
  const { status } = useSession();
  const signedIn = status === "authenticated";

  const ready = runtime !== null && tier !== null;
  const runtimeOpt = RUNTIMES.find((o) => o.id === runtime);
  const tierOpt = MODELS.find((o) => o.id === tier);

  const wizardUrl = ready
    ? `/create-agent?runtime=${runtime}&tier=${tier}`
    : "/create-agent";
  const href = signedIn
    ? wizardUrl
    : `/sign-in?callbackUrl=${encodeURIComponent(wizardUrl)}`;

  const cta = signedIn
    ? ready
      ? "Deploy →"
      : "Select options above"
    : ready
      ? "Sign in & deploy →"
      : "Sign in with Google";

  return (
    <section className="fg fgdeploy">
      <div className="fg__wrap">
        <div className="fg__head" data-reveal>
          <span className="fg__eyebrow">What you can deploy</span>
          <h2 className="fg__h2">
            Pick a runtime and a model. <span className="fg__molten">Watch it seal.</span>
          </h2>
          <p className="fg__lead">
            Your choice is forged into a sealed manifest and cast into your own
            confidential SecretVM.
          </p>
        </div>

        <div className="fgdeploy__grid">
          {/* left — selectors */}
          <div>
            <div className="fggroup">
              <p className="fggroup__label">1 · Choose a runtime</p>
              <div className="fggroup__opts">
                {RUNTIMES.map((opt) => (
                  <OptionCard
                    key={opt.id}
                    opt={opt}
                    selected={runtime === opt.id}
                    onClick={() => setRuntime(opt.id)}
                  />
                ))}
              </div>
            </div>
            <div className="fggroup">
              <p className="fggroup__label">2 · Choose a model</p>
              <div className="fggroup__opts">
                {MODELS.map((opt) => (
                  <OptionCard
                    key={opt.id}
                    opt={opt}
                    selected={tier === opt.id}
                    onClick={() => setTier(opt.id)}
                  />
                ))}
              </div>
            </div>

            <div className="fgdeploy__cta">
              <Link
                href={href}
                aria-disabled={!ready}
                onClick={(e) => {
                  if (!ready) e.preventDefault();
                }}
                className={ready ? "fgbtn" : "fgbtn fgbtn--idle"}
              >
                {cta}
              </Link>
              <span className="fgdeploy__hint">
                {ready
                  ? "Manifest ready — sign in to seal it."
                  : "Select a runtime and a model to continue."}
              </span>
            </div>
          </div>

          {/* right — live sealed manifest (mirrors the hero card) */}
          <div className="man__side">
            <div className="man__card">
              <div className="man__head">
                <span className="d" />
                agent.sealed
              </div>
              <div className="man__body">
                <ManifestRow
                  k="runtime"
                  value={runtimeOpt?.manifest ?? "— pick one"}
                  pending={!runtimeOpt}
                />
                <ManifestRow
                  k="model"
                  value={tierOpt?.manifest ?? "— pick one"}
                  pending={!tierOpt}
                />
                <ManifestRow k="keys" value="forged in-enclave" ok />
                <ManifestRow k="tools" value="Gmail · sealed" ok />
                <ManifestRow
                  k="attestation"
                  value={ready ? "9F3A…01E4" : "awaiting seal"}
                  pending={!ready}
                  ok
                />
                <ManifestRow k="operator" value="no access" />
              </div>

              <svg
                className={`man__stamp man__stamp--live${ready ? "" : " man__stamp--pending"}`}
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <defs>
                  <radialGradient id="fgd-metal" cx="42%" cy="34%" r="75%">
                    <stop offset="0%" stopColor="#4a3b30" />
                    <stop offset="45%" stopColor="#2a221d" />
                    <stop offset="100%" stopColor="#14100d" />
                  </radialGradient>
                  <linearGradient id="fgd-ember" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FFB020" />
                    <stop offset="40%" stopColor="#FF7A18" />
                    <stop offset="100%" stopColor="#FB2011" />
                  </linearGradient>
                  <path id="fgd-ring" d="M50,14 a36,36 0 1,1 -0.1,0" />
                </defs>
                <circle cx="50" cy="50" r="48" fill="url(#fgd-metal)" stroke="#3a2e26" strokeWidth="1.5" />
                <circle cx="50" cy="50" r="39" fill="none" stroke="#3a2e26" strokeWidth="1" />
                <text fontFamily="var(--font-mono), monospace" fontSize="8.5" letterSpacing="2.4" fill="#9C948A">
                  <textPath href="#fgd-ring" startOffset="0%">
                    · SEALED · ATTESTED · SECRETVM ·
                  </textPath>
                </text>
                <image
                  href="/brand/logo-cream.png"
                  x="24"
                  y="24"
                  width="52"
                  height="52"
                  preserveAspectRatio="xMidYMid meet"
                  transform="rotate(15 50 50)"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
