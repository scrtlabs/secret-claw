import HomeShell from "@/components/homepage/HomeShell";
import HeroManifestThemed from "@/components/homepage/HeroManifestThemed";

// Variant 6 — Manifest, "Ultraviolet" theme: violet on slate, Sora.
export default function VariantUltraviolet() {
  return <HomeShell hero={<HeroManifestThemed theme="t-uv" idPrefix="uv" />} />;
}
