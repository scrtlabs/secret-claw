import type { Metadata } from "next";
import HomeShell from "@/components/homepage/HomeShell";
import HeroManifestThemed from "@/components/homepage/HeroManifestThemed";

// Exploratory design preview — keep it out of search indexes.
export const metadata: Metadata = { robots: { index: false, follow: false } };

// Variant 6 — Manifest, "Ultraviolet" theme: violet on slate, Sora.
export default function VariantUltraviolet() {
  return <HomeShell hero={<HeroManifestThemed theme="t-uv" idPrefix="uv" />} />;
}
