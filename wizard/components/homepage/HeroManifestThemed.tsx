"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

// Manifest layout + copy, driven entirely by CSS variables so a theme is just a
// palette + font pairing. `theme` is a class like "t-steel" | "t-signet" | "t-uv".
export default function HeroManifestThemed({
  theme,
  idPrefix,
}: {
  theme: string;
  idPrefix: string;
}) {
  const { status } = useSession();
  const signedIn = status === "authenticated";
  const forgeHref = signedIn ? "/create-agent" : "/sign-in";

  return (
    <section className={`mf ${theme}`}>
      <div className="mf__wrap">
        <div className="mf__grid">
          {/* Left — Foundry copy */}
          <div>
            <span className="mf__eyebrow">Confidential compute · Powered by SecretVM</span>

            <h1 className="mf__h1">
              Forge an agent
              <span className="mf__accent">only you can open.</span>
            </h1>

            <p className="mf__sub">
              SecretForge casts your AI agent inside a sealed enclave and stamps
              it with a hardware-signed mark.{" "}
              <b>Your keys, your conversations, your tools — hammered shut.</b>{" "}
              Not even we hold the mold.
            </p>

            <div className="mf__actions">
              <Link href={forgeHref} className="mf__btn">
                Forge your agent →
              </Link>
              <a href="#how-it-works" className="mf__ghost">
                Inspect the proof <span className="mf__k">↓</span>
              </a>
            </div>

            <div className="mf__specs">
              <div>
                <div className="mf__n">
                  &lt;5<span className="u">min</span>
                </div>
                <div className="mf__l">from sign-in to running</div>
              </div>
              <div>
                <div className="mf__n">2</div>
                <div className="mf__l">runtimes · OpenClaw / Hermes</div>
              </div>
              <div>
                <div className="mf__n">0</div>
                <div className="mf__l">keys we can read</div>
              </div>
            </div>
          </div>

          {/* Right — sealed manifest card */}
          <div className="mf__side">
            <div className="mf__card">
              <div className="mf__head">
                <span className="d" />
                agent.sealed
              </div>
              <div className="mf__body">
                <div className="mf__row">
                  <span className="mf__rk">runtime</span>
                  <span className="mf__rv">OpenClaw</span>
                </div>
                <div className="mf__row">
                  <span className="mf__rk">model</span>
                  <span className="mf__rv">Claude · BYO key</span>
                </div>
                <div className="mf__row">
                  <span className="mf__rk">keys</span>
                  <span className="mf__rv">
                    forged in-enclave <span className="mf__ok">✓</span>
                  </span>
                </div>
                <div className="mf__row">
                  <span className="mf__rk">tools</span>
                  <span className="mf__rv">
                    Gmail · sealed <span className="mf__ok">✓</span>
                  </span>
                </div>
                <div className="mf__row">
                  <span className="mf__rk">attestation</span>
                  <span className="mf__rv">
                    9F3A…01E4 <span className="mf__ok">✓</span>
                  </span>
                </div>
                <div className="mf__row">
                  <span className="mf__rk">operator</span>
                  <span className="mf__rv">no access</span>
                </div>
              </div>

              <svg
                className="mf__stamp"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <defs>
                  <radialGradient id={`${idPrefix}-metal`} cx="42%" cy="34%" r="75%">
                    <stop offset="0%" stopColor="#35353c" />
                    <stop offset="45%" stopColor="#1b1b20" />
                    <stop offset="100%" stopColor="#0d0d10" />
                  </radialGradient>
                  <linearGradient id={`${idPrefix}-accent`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="var(--mf-accent2)" />
                    <stop offset="100%" stopColor="var(--mf-accent)" />
                  </linearGradient>
                  <path id={`${idPrefix}-ring`} d="M50,14 a36,36 0 1,1 -0.1,0" />
                </defs>
                <circle cx="50" cy="50" r="48" fill={`url(#${idPrefix}-metal)`} stroke="var(--mf-card-line, var(--mf-line))" strokeWidth="1.5" />
                <circle cx="50" cy="50" r="39" fill="none" stroke="var(--mf-card-line, var(--mf-line))" strokeWidth="1" />
                <text fontFamily="var(--mf-mono), monospace" fontSize="8.5" letterSpacing="2.4" fill="var(--mf-card-dim, var(--mf-dim))">
                  <textPath href={`#${idPrefix}-ring`} startOffset="0%">
                    · SEALED · ATTESTED · SECRETVM ·
                  </textPath>
                </text>
                <text
                  x="50"
                  y="60"
                  textAnchor="middle"
                  fontFamily="var(--mf-display), sans-serif"
                  fontWeight="800"
                  fontSize="30"
                  letterSpacing="-2"
                  fill={`url(#${idPrefix}-accent)`}
                >
                  SF
                </text>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
