import type { Metadata } from "next";
import HomeShell from "@/components/homepage/HomeShell";
import HeroManifestThemed from "@/components/homepage/HeroManifestThemed";

// Exploratory design preview — keep it out of search indexes.
export const metadata: Metadata = { robots: { index: false, follow: false } };

// Variant 4 — Manifest, "Cold Steel" theme: cyan on graphite, Space Grotesk.
export default function VariantSteel() {
  return <HomeShell hero={<HeroManifestThemed theme="t-steel" idPrefix="steel" />} />;
}
