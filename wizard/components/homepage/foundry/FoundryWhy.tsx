import type { ReactNode } from "react";

// Forged 2.5px line-icons, echoing the hero's line-art (currentColor = molten).
const IconSealed = (
  <svg className="fgcard__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="10.5" width="16" height="9.5" rx="2" />
    <path d="M7.5 10.5V7.5a4.5 4.5 0 0 1 9 0v3" />
    <path d="M12 14v2.5" />
  </svg>
);
const IconAgent = (
  <svg className="fgcard__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="5" y="7.5" width="14" height="11" rx="2.5" />
    <path d="M9 12h0M15 12h0" />
    <path d="M12 3.5v4M9.5 18.5v2M14.5 18.5v2" />
  </svg>
);
const IconKey = (
  <svg className="fgcard__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="8" cy="16" r="4" />
    <path d="M10.8 13.2 20 4M17 7l2.5 2.5M14.5 9.5 17 12" />
  </svg>
);

const CARDS: { kicker: string; icon: ReactNode; heading: string; body: string }[] = [
  {
    kicker: "enclave",
    icon: IconSealed,
    heading: "Your data, sealed",
    body:
      "When your agent connects to Gmail or your files, those credentials live in your private enclave — not in a third-party cloud.",
  },
  {
    kicker: "runtime",
    icon: IconAgent,
    heading: "A real AI agent",
    body:
      "Powered by OpenClaw or Hermes. Reads your email, takes actions, runs on your schedule. No middleman.",
  },
  {
    kicker: "keys",
    icon: IconKey,
    heading: "You hold the keys",
    body:
      "Your API keys are sealed inside your VM at rest. We never see them. Neither does anyone else.",
  },
];

export default function FoundryWhy() {
  return (
    <section className="fg fgwhy">
      <div className="fg__wrap">
        <div className="fg__head">
          <span className="fg__eyebrow">Why SecretForge</span>
          <h2 className="fg__h2">
            Your agent. <span className="fg__molten">Your rules.</span>
          </h2>
        </div>

        <div className="fgwhy__grid">
          {CARDS.map((card) => (
            <article key={card.heading} className="fgcard">
              <span className="fgcard__kicker">{card.kicker}</span>
              {card.icon}
              <h3 className="fgcard__h">{card.heading}</h3>
              <p className="fgcard__p">{card.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
