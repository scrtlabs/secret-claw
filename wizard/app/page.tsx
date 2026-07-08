import type { Metadata } from "next";
import HeroManifest from "@/components/homepage/HeroManifest";
import FoundryNav from "@/components/homepage/foundry/FoundryNav";
import FoundryWhy from "@/components/homepage/foundry/FoundryWhy";
import FoundryHow from "@/components/homepage/foundry/FoundryHow";
import FoundryDeploy from "@/components/homepage/foundry/FoundryDeploy";
import FoundryFooter from "@/components/homepage/foundry/FoundryFooter";

export const metadata: Metadata = {
  icons: {
    icon: [{ url: "/brand/favicon-clean-red.ico" }],
    apple: "/brand/apple-touch-icon.png",
  },
};

export default function HomePage() {
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
