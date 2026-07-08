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

export default function PrivacyPage() {
  return (
    <div className="fg-page">
      <FoundryNav />
      <main>
        <article className="fglegal">
          <span className="fglegal__eyebrow">Legal</span>
          <h1 className="fglegal__h1">Privacy Policy</h1>
          <p className="fglegal__meta">SecretForge · operated by Gamma Research and Development Ltd.</p>

          <p className="fglegal__intro">
            This Privacy Policy governs how Gamma Research and Development Ltd.
            (&ldquo;we&rdquo;, &ldquo;us&rdquo;), the operator of SecretForge,
            collects, receives, uses, and stores Personal Information when you use
            SecretForge to forge and run AI agents inside your own confidential
            SecretVM enclave.
          </p>

          <hr className="fglegal__rule" />

          <section>
            <h2><span className="fglegal__no">01</span> Introduction</h2>
            <p>
              We are committed to safeguarding user privacy and complying with
              applicable laws, including the Israeli Protection of Privacy Law,
              5741-1981. &ldquo;Personal Information&rdquo; means any information
              that can identify an individual, such as name, email, billing
              details, or contact information.
            </p>
          </section>

          <section>
            <h2><span className="fglegal__no">02</span> Scope and Consent</h2>
            <p>
              By accessing SecretForge and its services, you consent to the terms
              of this Privacy Policy and our collection, processing, and disclosure
              of your Personal Information. We may update this policy periodically;
              continued use of SecretForge after changes become effective
              constitutes acceptance of the revised Policy. Updates are posted at
              least ten days before taking effect.
            </p>
          </section>

          <section>
            <h2><span className="fglegal__no">03</span> Information We Collect</h2>
            <ul>
              <li><b>Account Information</b> — the name and email address from the Google account you sign in with.</li>
              <li><b>Agent Configuration</b> — the choices you make in the wizard: runtime (OpenClaw / Hermes), model tier, and which connectors you enable.</li>
              <li><b>Service Usage Data</b> — SecretVM deployment logs, session data, and diagnostic events needed to run and support your agent.</li>
              <li><b>Device Data</b> — browser type, IP address, time zone, and operating system.</li>
              <li><b>Payment Data</b> — processed by third-party providers; full payment details are not stored by us.</li>
            </ul>
          </section>

          <section>
            <h2><span className="fglegal__no">04</span> How We Use Personal Information</h2>
            <p>
              We use Personal Information to operate SecretForge, provision your
              agent into a confidential SecretVM, manage your account and billing,
              provide support, monitor service integrity, and comply with our legal
              obligations.
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
            <h2><span className="fglegal__no">06</span> Your Keys, Tokens &amp; Enclave Data</h2>
            <p>
              Your agent runs inside a confidential SecretVM, executed within Intel
              TDX-based Trusted Execution Environments (TEEs). API keys you bring
              (such as an Anthropic key) and any connector tokens you grant (such as
              Gmail) are sealed inside your enclave.{" "}
              <b>We do not have plaintext access to your keys, connector tokens, or
              the contents of your agent&rsquo;s conversations.</b>
            </p>
          </section>

          <section>
            <h2><span className="fglegal__no">07</span> Data Security</h2>
            <p>
              We use appropriate technical and organizational measures to protect
              the data we hold. Confidential-compute workloads are isolated within
              the TEE-backed SecretVM described above.
            </p>
          </section>

          <section>
            <h2><span className="fglegal__no">08</span> Your Rights</h2>
            <p>
              Depending on your jurisdiction, you may access, modify, delete,
              restrict, or request portability of your Personal Information by
              contacting us.
            </p>
          </section>

          <section>
            <h2><span className="fglegal__no">09</span> Data Retention</h2>
            <p>
              We retain Personal Information as necessary for the purposes stated
              above, unless a longer retention period is required by law, after
              which it is securely deleted when no longer needed.
            </p>
          </section>

          <section>
            <h2><span className="fglegal__no">10</span> Contact Us</h2>
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
