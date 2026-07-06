import type { Metadata } from "next";
import HomeShell from "@/components/homepage/HomeShell";
import HeroManifestThemed from "@/components/homepage/HeroManifestThemed";

// Exploratory design preview — keep it out of search indexes.
export const metadata: Metadata = { robots: { index: false, follow: false } };

// Variant 5 — Manifest, "Signet" theme: gold on ink, Fraunces serif display.
export default function VariantSignet() {
  return <HomeShell hero={<HeroManifestThemed theme="t-signet" idPrefix="signet" />} />;
}
