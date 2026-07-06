import type { Metadata } from "next";
import HomeShell from "@/components/homepage/HomeShell";
import HeroMonument from "@/components/homepage/HeroMonument";

// Exploratory design preview — keep it out of search indexes.
export const metadata: Metadata = { robots: { index: false, follow: false } };

// Variant 2 — Foundry copy, "Monument" centered typographic treatment.
export default function VariantMonument() {
  return <HomeShell hero={<HeroMonument />} />;
}
