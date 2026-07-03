import HomeShell from "@/components/homepage/HomeShell";
import HeroManifestThemed from "@/components/homepage/HeroManifestThemed";

// Variant 4 — Manifest, "Cold Steel" theme: cyan on graphite, Space Grotesk.
export default function VariantSteel() {
  return <HomeShell hero={<HeroManifestThemed theme="t-steel" idPrefix="steel" />} />;
}
