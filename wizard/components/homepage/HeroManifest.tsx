"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import EmberCanvas from "@/components/homepage/foundry/EmberCanvas";
import ForgeAnimation from "@/components/homepage/foundry/ForgeAnimation";

// The sealed card cycles through the runtimes and models you could forge.
const RUNTIMES = ["Hermes", "OpenClaw"];
const MODELS = [
  "ChatGPT · BYO key",
  "SecretAI · in-enclave",
  "Claude · BYO key",
  "SecretAI · in-enclave",
];
const TOOLS = [
  "Telegram · Slack",
  "Gmail · Calendar",
  "GitHub · Linear",
  "Gmail · Drive",
];

// Deterministic per-tick hex (seeded by tick so SSR and first client render
// agree — avoids a hydration mismatch — then it changes on every tick).
function attestSegment(tick: number, salt: number): string {
  const v = ((tick + 1) * 0x9e3779b1 + salt) >>> 0;
  return ((v >>> 8) & 0xffff).toString(16).toUpperCase().padStart(4, "0");
}

// Variant 3 — same Foundry copy + left column, but the right-side artifact is a
// sealed config "manifest" card (wax-seal stamp + molten edge).
export default function HeroManifest() {
  const { status } = useSession();
  const signedIn = status === "authenticated";
  const forgeHref = signedIn ? "/create-agent" : "/sign-in";

  // Advance one step every 2.4s; runtime and model swap together on each tick.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 2600);
    return () => clearInterval(id);
  }, []);
  const runtime = RUNTIMES[tick % RUNTIMES.length];
  const model = MODELS[tick % MODELS.length];
  const tools = TOOLS[tick % TOOLS.length];
  const attestation = `${attestSegment(tick, 0x1111)}…${attestSegment(tick, 0x7777)}`;

  return (
    <section className="fh fh--secret">
      <EmberCanvas />
      <div className="fh__wrap">
        <div className="fh__grid">
          {/* Left — identical Foundry copy */}
          <div>
            <span className="fh__eyebrow">Confidential compute · Powered by SecretVM</span>

            <h1 className="fh__h1">
              Forge an agent
              <span className="fh__molten">that answers only to you.</span>
            </h1>

            <p className="fh__sub">
              SecretForge casts your AI agent inside a sealed enclave and stamps
              it with a hardware-signed mark.{" "}
              <b>Your keys, your conversations, your tools — hammered shut.</b>{" "}
              Not even we hold the mold.
            </p>

            <div className="fh__actions">
              <Link href={forgeHref} className="fh__btn">
                Forge your agent →
              </Link>
              <a href="#how-it-works" className="fh__ghost">
                Inspect the proof <span className="fh__k">↓</span>
              </a>
            </div>

            <div className="fh__specs">
              <div className="fh__spec">
                <div className="fh__n">
                  &lt;5<span className="fh__u">min</span>
                </div>
                <div className="fh__l">from sign-in to running</div>
              </div>
              <div className="fh__spec">
                <div className="fh__n">2</div>
                <div className="fh__l">runtimes · OpenClaw / Hermes</div>
              </div>
              <div className="fh__spec">
                <div className="fh__n">0</div>
                <div className="fh__l">keys we can read</div>
              </div>
            </div>
          </div>

          {/* Right — sealed manifest card */}
          <div className="man__side">
            <div className="man__card">
              <div className="man__head">
                <span className="d" />
                agent.sealed
              </div>
              <div className="man__body">
                <div className="man__row">
                  <span className="man__k">runtime</span>
                  <span className="man__v">
                    <span key={runtime} className="man__cycle">{runtime}</span>
                  </span>
                </div>
                <div className="man__row">
                  <span className="man__k">model</span>
                  <span className="man__v">
                    <span key={model} className="man__cycle">{model}</span>
                  </span>
                </div>
                <div className="man__row">
                  <span className="man__k">keys</span>
                  <span className="man__v">
                    forged in-enclave <span className="man__ok">✓</span>
                  </span>
                </div>
                <div className="man__row">
                  <span className="man__k">tools</span>
                  <span className="man__v">
                    <span key={tools} className="man__cycle">{tools}</span> · sealed{" "}
                    <span className="man__ok">✓</span>
                  </span>
                </div>
                <div className="man__row">
                  <span className="man__k">attestation</span>
                  <span className="man__v">
                    <span key={attestation} className="man__cycle">{attestation}</span>{" "}
                    <span className="man__ok">✓</span>
                  </span>
                </div>
                <div className="man__row">
                  <span className="man__k">operator</span>
                  <span className="man__v">no access</span>
                </div>
              </div>

              {/* stamp — circular badge with animation inside */}
              <div className="man__stamp">
                {/* animation clipped to circle */}
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", overflow: "hidden" }}>
                  <ForgeAnimation style={{ width: "100%", height: "100%" }} />
                </div>
                {/* circle border + curved text overlay */}
                <svg viewBox="0 0 96 96" aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
                  <circle cx="48" cy="48" r="45" fill="none" stroke="var(--bronze)" strokeWidth="1.5" />
                  <circle cx="48" cy="48" r="39" fill="none" stroke="var(--bronze)" strokeWidth="0.5" strokeDasharray="2 3" opacity="0.6" />
                  <defs>
                    <path id="hero-top" d="M 14 48 A 34 34 0 0 1 82 48" />
                    <path id="hero-bot" d="M 14 48 A 34 34 0 0 0 82 48" />
                  </defs>
                  <text fontFamily="var(--font-mono),monospace" fontSize="7" letterSpacing="2.5" fill="var(--ember2)">
                    <textPath href="#hero-top" startOffset="50%" textAnchor="middle">SEALED · FORGED</textPath>
                  </text>
                  <text fontFamily="var(--font-mono),monospace" fontSize="7" letterSpacing="2" fill="var(--cast-dim)">
                    <textPath href="#hero-bot" startOffset="50%" textAnchor="middle">SecretForge</textPath>
                  </text>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
