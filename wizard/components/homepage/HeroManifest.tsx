"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

// The sealed card cycles through the runtimes and models you could forge.
const RUNTIMES = ["OpenClaw", "Hermes"];
const MODELS = [
  "Claude · BYO key",
  "ChatGPT · BYO key",
  "SecretAI gpt-oss",
  "SecretAI Gemma",
];

// Variant 3 — same Foundry copy + left column, but the right-side artifact is a
// sealed config "manifest" card (wax-seal stamp + molten edge).
export default function HeroManifest() {
  const { status } = useSession();
  const signedIn = status === "authenticated";
  const forgeHref = signedIn ? "/create-agent" : "/sign-in";

  // Advance one step every 2.4s; runtime and model swap together on each tick.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 2400);
    return () => clearInterval(id);
  }, []);
  const runtime = RUNTIMES[tick % RUNTIMES.length];
  const model = MODELS[tick % MODELS.length];

  return (
    <section className="fh fh--secret">
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
                    Gmail · sealed <span className="man__ok">✓</span>
                  </span>
                </div>
                <div className="man__row">
                  <span className="man__k">attestation</span>
                  <span className="man__v">
                    9F3A…01E4 <span className="man__ok">✓</span>
                  </span>
                </div>
                <div className="man__row">
                  <span className="man__k">operator</span>
                  <span className="man__v">no access</span>
                </div>
              </div>

              {/* wax / metal seal stamp */}
              <svg
                className="man__stamp"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <defs>
                  <radialGradient id="man-metal" cx="42%" cy="34%" r="75%">
                    <stop offset="0%" stopColor="#4a3b30" />
                    <stop offset="45%" stopColor="#2a221d" />
                    <stop offset="100%" stopColor="#14100d" />
                  </radialGradient>
                  <linearGradient id="man-ember" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FFB020" />
                    <stop offset="40%" stopColor="#FF7A18" />
                    <stop offset="70%" stopColor="#FB2011" />
                    <stop offset="100%" stopColor="#FB2011" />
                  </linearGradient>
                  <path id="man-ring" d="M50,14 a36,36 0 1,1 -0.1,0" />
                </defs>
                <circle cx="50" cy="50" r="48" fill="url(#man-metal)" stroke="#3a2e26" strokeWidth="1.5" />
                <circle cx="50" cy="50" r="39" fill="none" stroke="#3a2e26" strokeWidth="1" />
                <text fontFamily="var(--font-mono), monospace" fontSize="8.5" letterSpacing="2.4" fill="#9C948A">
                  <textPath href="#man-ring" startOffset="0%">
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
