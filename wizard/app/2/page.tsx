import HomeShell from "@/components/homepage/HomeShell";
import HeroMonument from "@/components/homepage/HeroMonument";

// Variant 2 — Foundry copy, "Monument" centered typographic treatment.
export default function VariantMonument() {
  return <HomeShell hero={<HeroMonument />} />;
}
