"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

// Variant 2 — same Foundry copy, centered "monument" typographic treatment.
export default function HeroMonument() {
  const { status } = useSession();
  const signedIn = status === "authenticated";
  const forgeHref = signedIn ? "/create-agent" : "/sign-in";

  return (
    <section className="mon">
      <div className="mon__wrap">
        {/* small stamped maker's mark */}
        <svg
          className="mon__badge"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="mon-metal" cx="42%" cy="34%" r="75%">
              <stop offset="0%" stopColor="#4a3b30" />
              <stop offset="45%" stopColor="#2a221d" />
              <stop offset="100%" stopColor="#14100d" />
            </radialGradient>
            <linearGradient id="mon-ember" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFB020" />
              <stop offset="55%" stopColor="#FF7A18" />
              <stop offset="100%" stopColor="#F2600C" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="48" fill="url(#mon-metal)" stroke="#3a2e26" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="40" fill="none" stroke="#3a2e26" strokeWidth="1" />
          <text
            x="50"
            y="64"
            textAnchor="middle"
            fontFamily="var(--font-archivo), sans-serif"
            fontWeight="900"
            fontSize="44"
            letterSpacing="-3"
            fill="url(#mon-ember)"
          >
            SF
          </text>
        </svg>

        <div className="mon__eyebrow">Confidential compute · Powered by SecretVM</div>

        <h1 className="mon__h1">
          Forge an agent
          <span className="mon__molten">only you can open.</span>
        </h1>

        <p className="mon__sub">
          SecretForge casts your AI agent inside a sealed enclave and stamps it
          with a hardware-signed mark.{" "}
          <b>Your keys, your conversations, your tools — hammered shut.</b> Not
          even we hold the mold.
        </p>

        <div className="mon__actions">
          <Link href={forgeHref} className="mon__btn">
            Forge your agent →
          </Link>
          <a href="#how-it-works" className="mon__ghost">
            Inspect the proof <span className="fh__k">↓</span>
          </a>
        </div>

        <div className="mon__rule" />

        <div className="mon__specs">
          <div className="mon__spec">
            <div className="mon__n">
              &lt;5<span className="u">min</span>
            </div>
            <div className="mon__l">from sign-in to running</div>
          </div>
          <div className="mon__spec">
            <div className="mon__n">2</div>
            <div className="mon__l">runtimes · OpenClaw / Hermes</div>
          </div>
          <div className="mon__spec">
            <div className="mon__n">0</div>
            <div className="mon__l">keys we can read</div>
          </div>
        </div>
      </div>
    </section>
  );
}
