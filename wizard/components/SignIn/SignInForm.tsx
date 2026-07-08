"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { keplrDetect, connectKeplrAndGetWalletInfo } from "@/lib/auth/keplr";
import { metamaskDetect, connectMetamaskAndGetWalletInfo } from "@/lib/auth/metamask";
import { KeplrIcon, MetaMaskIcon } from "@/components/ui/WalletIcons";
import { useGooglePopup } from "@/lib/auth/useGooglePopup";

type WalletModal = null | "keplr" | "metamask";
type InstallPrompt = null | "keplr" | "metamask";

const forgeInput =
  "w-full rounded-md border border-[var(--bronze)] px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-1 focus:border-[var(--molten)] focus:ring-[var(--molten)]/30 placeholder:text-[var(--cast-dimmer)] disabled:opacity-50";

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/create-agent";

  const [openGooglePopup, googlePending] = useGooglePopup(callbackUrl);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  const [walletModal, setWalletModal] = useState<WalletModal>(null);
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt>(null);
  const [walletError, setWalletError] = useState("");
  const [walletLoading, setWalletLoading] = useState(false);

  // ── Email/Password ──────────────────────────────────────────────────────────

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setEmailLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setEmailLoading(false);

    if (result?.error) {
      setEmailError(result.error === "CredentialsSignin" ? "Invalid email or password." : result.error);
      return;
    }

    router.push(callbackUrl);
  };

  // ── Wallet selection ────────────────────────────────────────────────────────

  const handleWalletSelect = async (wallet: "keplr" | "metamask") => {
    setWalletError("");
    setInstallPrompt(null);

    if (wallet === "keplr") {
      if (!keplrDetect()) { setInstallPrompt("keplr"); return; }
      await connectKeplr();
    } else {
      if (!metamaskDetect()) { setInstallPrompt("metamask"); return; }
      await connectMetaMask();
    }
  };

  const connectKeplr = async () => {
    setWalletLoading(true);
    const result = await connectKeplrAndGetWalletInfo();
    if (!result.success || !result.walletInfo) {
      setWalletError(result.error ?? "Failed to connect Keplr.");
      setWalletLoading(false);
      return;
    }

    const signInResult = await signIn("keplr", {
      walletAddress: result.walletInfo.address,
      signature: result.walletInfo.signature,
      message: result.walletInfo.message,
      redirect: false,
    });

    setWalletLoading(false);
    if (signInResult?.error) { setWalletError(signInResult.error); return; }

    setWalletModal(null);
    router.push(callbackUrl);
  };

  const connectMetaMask = async () => {
    setWalletLoading(true);
    const result = await connectMetamaskAndGetWalletInfo();
    if (!result.success || !result.walletInfo) {
      setWalletError(result.error ?? "Failed to connect MetaMask.");
      setWalletLoading(false);
      return;
    }

    const signInResult = await signIn("metamask", {
      walletAddress: result.walletInfo.address,
      signature: result.walletInfo.signature,
      message: result.walletInfo.message,
      redirect: false,
    });

    setWalletLoading(false);
    if (signInResult?.error) { setWalletError(signInResult.error); return; }

    setWalletModal(null);
    router.push(callbackUrl);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* Email + Password */}
      <form onSubmit={handleEmailSignIn} className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={forgeInput}
          style={{ background: "var(--iron)", color: "var(--cast)" }}
        />
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={forgeInput}
            style={{ background: "var(--iron)", color: "var(--cast)" }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--cast-dim)] hover:text-[var(--cast)]"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        {emailError && <p className="text-xs text-red-400">{emailError}</p>}

        <div className="flex justify-end">
          <a href="/forgot-password" className="text-xs text-[var(--ember2)] hover:underline">
            Forgot password?
          </a>
        </div>

        <button
          type="submit"
          disabled={emailLoading || googlePending}
          className="fgbtn w-full disabled:opacity-50"
        >
          {emailLoading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-[var(--bronze)]/40" />
        <span className="text-xs text-[var(--cast-dimmer)]">or</span>
        <div className="flex-1 border-t border-[var(--bronze)]/40" />
      </div>

      {/* Google */}
      <button
        type="button"
        onClick={openGooglePopup}
        disabled={googlePending}
        className="flex w-full items-center justify-center gap-3 rounded-md border border-[var(--bronze)] px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-[var(--bronze)]/10 disabled:cursor-not-allowed disabled:opacity-50"
        style={{ background: "var(--iron)", color: "var(--cast)" }}
      >
        {googlePending ? (
          <Spinner className="h-5 w-5 text-[var(--cast-dim)]" />
        ) : (
          <GoogleGlyph className="h-5 w-5" />
        )}
        {googlePending ? "Waiting for Google…" : "Continue with Google"}
      </button>

      {/* Connect Wallet */}
      <button
        type="button"
        disabled={googlePending}
        onClick={() => { setWalletModal("keplr"); setInstallPrompt(null); setWalletError(""); }}
        className="flex w-full items-center justify-center gap-3 rounded-md border border-[var(--bronze)] px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-[var(--bronze)]/10 disabled:cursor-not-allowed disabled:opacity-50"
        style={{ background: "var(--iron)", color: "var(--cast)" }}
      >
        <WalletIcon className="h-5 w-5" />
        Connect Wallet
      </button>

      {/* Wallet modal */}
      {walletModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setWalletModal(null)}
        >
          <div
            className="w-80 rounded-xl border border-[var(--bronze)] p-6 shadow-xl"
            style={{ background: "linear-gradient(180deg, #1a1613, #141110)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-center text-sm font-semibold" style={{ color: "var(--cast)" }}>
              Select your wallet
            </h2>

            {!installPrompt ? (
              <div className="flex gap-4">
                <WalletOption
                  icon={<KeplrIcon className="h-10 w-10" />}
                  label="Keplr"
                  disabled={walletLoading}
                  onClick={() => handleWalletSelect("keplr")}
                />
                <WalletOption
                  icon={<MetaMaskIcon className="h-10 w-10" />}
                  label="MetaMask"
                  disabled={walletLoading}
                  onClick={() => handleWalletSelect("metamask")}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 text-center">
                {installPrompt === "keplr"
                  ? <KeplrIcon className="h-12 w-12" />
                  : <MetaMaskIcon className="h-12 w-12" />
                }
                <p className="text-sm text-[var(--cast-dim)]">
                  {installPrompt === "keplr" ? "Keplr" : "MetaMask"} wallet not detected. Please install the extension to continue.
                </p>
                <a
                  href={installPrompt === "keplr" ? "https://www.keplr.app/" : "https://metamask.io/"}
                  target="_blank"
                  rel="noreferrer"
                  className="fgbtn px-4 py-2 text-sm"
                >
                  Install {installPrompt === "keplr" ? "Keplr" : "MetaMask"}
                </a>
              </div>
            )}

            {walletError && (
              <p className="mt-3 text-center text-xs text-red-400">{walletError}</p>
            )}

            {walletLoading && (
              <p className="mt-3 text-center text-xs text-[var(--cast-dim)]">Connecting…</p>
            )}

            <button
              type="button"
              onClick={() => setWalletModal(null)}
              className="mt-4 w-full text-center text-xs text-[var(--cast-dimmer)] hover:text-[var(--cast)]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function WalletOption({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-1 flex-col items-center gap-2 rounded-lg border border-[var(--bronze)]/60 p-4 transition-colors hover:bg-[var(--bronze)]/10 disabled:opacity-50"
      style={{ background: "var(--iron)" }}
    >
      {icon}
      <span className="text-sm text-[var(--cast)]">{label}</span>
    </button>
  );
}

function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className ?? ""}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
    </svg>
  );
}
