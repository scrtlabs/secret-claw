import HomeShell from "@/components/homepage/HomeShell";
import HeroManifest from "@/components/homepage/HeroManifest";

// Variant 3 — Foundry copy, "Manifest" sealed-config-card treatment.
export default function VariantManifest() {
  return <HomeShell hero={<HeroManifest />} />;
}
