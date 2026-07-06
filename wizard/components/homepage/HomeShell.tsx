import Nav from "@/components/homepage/Nav";
import WhyCards from "@/components/homepage/WhyCards";
import HowItWorks from "@/components/homepage/HowItWorks";
import WhatYouDeploy from "@/components/homepage/WhatYouDeploy";
import HomepageFooter from "@/components/homepage/HomepageFooter";

/**
 * Shared homepage chrome. Every homepage variant renders the same nav, body
 * sections, and footer — only the hero differs. Pass the hero to swap it.
 */
export default function HomeShell({ hero }: { hero: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-portal-bg text-portal-text">
      <Nav />
      <main>
        {hero}
        <WhyCards />
        <HowItWorks />
        <WhatYouDeploy />
      </main>
      <HomepageFooter />
    </div>
  );
}
