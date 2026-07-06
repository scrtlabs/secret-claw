import type { Metadata } from "next";
import HomeShell from "@/components/homepage/HomeShell";
import HeroManifestThemed from "@/components/homepage/HeroManifestThemed";

// Exploratory design preview — keep it out of search indexes.
export const metadata: Metadata = { robots: { index: false, follow: false } };

// Variant 7 — Manifest, "SecretAI" theme: light cream/peach, coral accent,
// Poppins display, with a dark navy config card for contrast.
export default function VariantSecretAI() {
  return <HomeShell hero={<HeroManifestThemed theme="t-secretai" idPrefix="secretai" />} />;
}
