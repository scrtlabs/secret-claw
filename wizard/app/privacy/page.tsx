import type { Metadata } from "next";
import FoundryNav from "@/components/homepage/foundry/FoundryNav";
import FoundryFooter from "@/components/homepage/foundry/FoundryFooter";

export const metadata: Metadata = {
  title: "Privacy Policy · SecretForge",
  icons: {
    icon: [{ url: "/brand/favicon-clean-red.ico" }],
    apple: "/brand/apple-touch-icon.png",
  },
};

// Adapted from the SecretAI Portal Privacy Policy (secretai.scrtlabs.com),
// Gamma Research and Development Ltd. Styled in the /3 Foundry language.
export default function PrivacyPage() {
  return (
    <div className="fg-page">
      <FoundryNav />
      <main>
        <article className="fglegal">
          <span className="fglegal__eyebrow">Legal</span>
          <h1 className="fglegal__h1">Privacy Policy</h1>
          <p className="fglegal__meta">SecretAI Portal · Gamma Research and Development Ltd.</p>

          <p className="fglegal__intro">
            This Privacy Policy governs how Gamma Research and Development Ltd.
            (&ldquo;we&rdquo;, &ldquo;us&rdquo;) collects, receives, uses, and
            stores Personal Information in connection with the SecretAI Portal at{" "}
            <a href="https://secretai.scrtlabs.com">secretai.scrtlabs.com</a>.
          </p>

          <hr className="fglegal__rule" />

          <section>
            <h2><span className="fglegal__no">01</span> Introduction</h2>
            <p>
              Gamma Research and Development commits to safeguarding user privacy
              and complying with applicable laws, including the Israeli Protection
              of Privacy Law, 5741-1981. &ldquo;Personal Information&rdquo; means
              any information that can identify an individual, such as name, email,
              billing details, or contact information.
            </p>
          </section>

          <section>
            <h2><span className="fglegal__no">02</span> Scope and Consent</h2>
            <p>
              By accessing the Website and services, you consent to the terms of
              this Privacy Policy and our collection, processing, and disclosure of
              your Personal Information. We may update this policy periodically;
              continued use of the Website after changes become effective
              constitutes acceptance of the revised Policy. Updates are posted at
              least ten days before taking effect.
            </p>
          </section>

          <section>
            <h2><span className="fglegal__no">03</span> Information We Collect</h2>
            <ul>
              <li><b>Account Information</b> — name, email, organizational details, credentials.</li>
              <li><b>Service Usage Data</b> — SDK logs, SecretVM deployment logs, session data.</li>
              <li><b>Device Data</b> — browser type, IP address, time zone, operating system.</li>
              <li><b>Payment Data</b> — processed by third-party providers; full payment details are not stored.</li>
            </ul>
          </section>

          <section>
            <h2><span className="fglegal__no">04</span> How We Use Personal Information</h2>
            <p>
              We use Personal Information to operate our services, provision and
              bill for them, manage accounts, provide support, monitor service
              integrity, and comply with our legal obligations.
            </p>
          </section>

          <section>
            <h2><span className="fglegal__no">05</span> Sharing of Personal Information</h2>
            <p>
              Personal Information may be shared with service providers, with legal
              authorities when required, and in the context of a business transfer.{" "}
              <b>We do not sell, lease, or rent your Personal Information.</b>
            </p>
          </section>

          <section>
            <h2><span className="fglegal__no">06</span> Data Security</h2>
            <p>
              We use appropriate measures to protect your data. Workloads processed
              via SecretVMs are executed inside Intel TDX-based Trusted Execution
              Environments (TEEs).
            </p>
          </section>

          <section>
            <h2><span className="fglegal__no">07</span> Your Rights</h2>
            <p>
              Depending on your jurisdiction, you may access, modify, delete,
              restrict, or request portability of your Personal Information by
              contacting us.
            </p>
          </section>

          <section>
            <h2><span className="fglegal__no">08</span> Data Retention</h2>
            <p>
              We retain Personal Information as necessary for the purposes stated
              above, unless a longer retention period is required by law, after
              which it is securely deleted when no longer needed.
            </p>
          </section>

          <section>
            <h2><span className="fglegal__no">09</span> Contact Us</h2>
            <p>
              Questions about this policy? Email{" "}
              <a href="mailto:info@scrtlabs.com">info@scrtlabs.com</a>.
            </p>
          </section>
        </article>
      </main>
      <FoundryFooter />
    </div>
  );
}
