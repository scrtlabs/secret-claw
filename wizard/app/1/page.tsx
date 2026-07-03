import HomeShell from "@/components/homepage/HomeShell";
import HeroFoundry from "@/components/homepage/HeroFoundry";

// Variant 1 — "The Foundry": industrial metal, molten ember, a forged maker's
// mark stamped with the enclave attestation.
export default function VariantFoundry() {
  return <HomeShell hero={<HeroFoundry />} />;
}
