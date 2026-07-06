"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export default function HeroFoundry() {
  const { status } = useSession();
  const signedIn = status === "authenticated";
  const forgeHref = signedIn ? "/create-agent" : "/sign-in";

  return (
    <section className="fh">
      <div className="fh__wrap">
        <div className="fh__grid">
          {/* Left — thesis */}
          <div>
            <span className="fh__eyebrow">Confidential compute · Powered by SecretVM</span>

            <h1 className="fh__h1">
              Forge an agent
              <span className="fh__molten">only you can open.</span>
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

          {/* Right — the maker's mark */}
          <div className="fh__sealwrap">
            <svg
              className="fh__seal"
              viewBox="0 0 420 420"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-label="SecretForge maker's mark — attestation verified"
            >
              <defs>
                <radialGradient id="fh-metal" cx="42%" cy="34%" r="75%">
                  <stop offset="0%" stopColor="#4a3b30" />
                  <stop offset="42%" stopColor="#2a221d" />
                  <stop offset="100%" stopColor="#14100d" />
                </radialGradient>
                <linearGradient id="fh-ember" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#FFB020" />
                  <stop offset="55%" stopColor="#FF7A18" />
                  <stop offset="100%" stopColor="#F2600C" />
                </linearGradient>
                <linearGradient id="fh-bevel" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6a5443" />
                  <stop offset="100%" stopColor="#241d18" />
                </linearGradient>
                <path id="fh-textring" d="M210,58 a152,152 0 1,1 -0.1,0" />
              </defs>

              {/* outer forged disc */}
              <circle cx="210" cy="210" r="200" fill="url(#fh-bevel)" />
              <circle cx="210" cy="210" r="196" fill="url(#fh-metal)" />
              <circle cx="210" cy="210" r="196" fill="none" stroke="#0b0908" strokeWidth="1.5" />

              {/* rotating attestation text ring */}
              <g className="fh__ring">
                <circle cx="210" cy="210" r="168" fill="none" stroke="#0f0c0a" strokeWidth="34" />
                <circle cx="210" cy="210" r="185" fill="none" stroke="#3a2e26" strokeWidth="1" />
                <circle cx="210" cy="210" r="151" fill="none" stroke="#3a2e26" strokeWidth="1" />
                <text
                  fontFamily="var(--font-mono), monospace"
                  fontSize="12.5"
                  letterSpacing="2.4"
                  fill="#9C948A"
                >
                  <textPath href="#fh-textring" startOffset="0%">
                    SHA256:9F3A·ENCLAVE MEASURED·ATTESTED ✓·SECRETVM·9F3A2C7B01E4·SEALED·
                  </textPath>
                </text>
              </g>

              {/* inner emblem plate */}
              <circle cx="210" cy="210" r="128" fill="url(#fh-bevel)" />
              <circle cx="210" cy="210" r="124" fill="url(#fh-metal)" />
              <circle cx="210" cy="210" r="124" fill="none" stroke="#0b0908" strokeWidth="1.5" />

              {/* molten SF monogram struck into metal */}
              <text
                x="210"
                y="214"
                textAnchor="middle"
                fontFamily="var(--font-archivo), sans-serif"
                fontWeight="900"
                fontSize="112"
                letterSpacing="-6"
                fill="url(#fh-ember)"
              >
                SF
              </text>
              <text
                x="210"
                y="300"
                textAnchor="middle"
                fontFamily="var(--font-mono), monospace"
                fontSize="13"
                letterSpacing="5"
                fill="#9C948A"
              >
                MAKER&apos;S MARK
              </text>

              {/* ember rim glint */}
              <circle
                cx="210"
                cy="210"
                r="196"
                fill="none"
                stroke="url(#fh-ember)"
                strokeWidth="1.5"
                strokeDasharray="2 320"
                strokeDashoffset="-40"
                opacity="0.8"
              />
            </svg>

            <div className="fh__attest">
              <span className="fh__dot" />
              Attestation <b>verified</b> · quote 9F3A…01E4
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
