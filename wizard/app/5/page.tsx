import HomeShell from "@/components/homepage/HomeShell";
import HeroManifestThemed from "@/components/homepage/HeroManifestThemed";

// Variant 5 — Manifest, "Signet" theme: gold on ink, Fraunces serif display.
export default function VariantSignet() {
  return <HomeShell hero={<HeroManifestThemed theme="t-signet" idPrefix="signet" />} />;
}
