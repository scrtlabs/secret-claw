import Link from "next/link";
import Image from "next/image";
import { NavAuthButtons } from "@/components/ui/NavAuthButtons";

// /3 — nav in the Foundry language: iron bar, hammer-forge brand mark.
export default function FoundryNav() {
  return (
    <nav className="fgnav">
      <div className="fgnav__wrap">
        <Link href="/" className="fgnav__brand">
          <Image
            className="fgnav__logo"
            src="/brand/logo-cream.png"
            alt="SecretForge"
            width={35}
            height={32}
            priority
          />
          <span className="fgnav__name">SecretForge</span>
        </Link>
        <NavAuthButtons size="sm" />
      </div>
    </nav>
  );
}
