import type { Metadata } from "next";
import {
  Archivo,
  JetBrains_Mono,
  Space_Grotesk,
  Fraunces,
  IBM_Plex_Mono,
  Sora,
  Poppins,
} from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/providers/AuthProvider";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-archivo",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
  display: "swap",
});

// These five are used only by the exploratory homepage variants (/2, /4-/7).
// preload:false keeps them off the critical path for every other route
// (the main site, sign-in, and the wizard) — they load only where used.
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-grotesk",
  display: "swap",
  preload: false,
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fraunces",
  display: "swap",
  preload: false,
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
  preload: false,
});

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-sora",
  display: "swap",
  preload: false,
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "SecretForge — Forge your AI agent",
  description:
    "Deploy your own private AI agent in a confidential enclave. Your keys, your data, your agent. Powered by SecretVM.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${archivo.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable} ${fraunces.variable} ${ibmPlexMono.variable} ${sora.variable} ${poppins.variable}`}
    >
      <body className="min-h-screen bg-portal-bg font-sans text-portal-text antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
