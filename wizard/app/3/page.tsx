import type { Metadata } from "next";
import HeroManifest from "@/components/homepage/HeroManifest";
import FoundryNav from "@/components/homepage/foundry/FoundryNav";
import FoundryWhy from "@/components/homepage/foundry/FoundryWhy";
import FoundryHow from "@/components/homepage/foundry/FoundryHow";
import FoundryDeploy from "@/components/homepage/foundry/FoundryDeploy";
import FoundryFooter from "@/components/homepage/foundry/FoundryFooter";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  icons: {
    icon: [{ url: "/brand/favicon-clean-red.ico" }],
    apple: "/brand/apple-touch-icon.png",
  },
};

// Variant 3 — the full page carries the Foundry / sealed-manifest language,
// hero through footer, on one continuous forged surface.
export default function VariantManifest() {
  return (
    <div className="fg-page">
      <FoundryNav />
      <main>
        <HeroManifest />
        <FoundryWhy />
        <FoundryHow />
        <FoundryDeploy />
      </main>
      <FoundryFooter />
    </div>
  );
}
