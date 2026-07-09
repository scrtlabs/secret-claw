import { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { syncPortalAccount } from "@/lib/portal-link/sync";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { fromBase64, fromBech32, toBech32 } from "@cosmjs/encoding";
import {
  Secp256k1,
  ExtendedSecp256k1Signature,
  Sha256,
} from "@cosmjs/crypto";
import { serializeSignDoc, makeSignDoc, rawSecp256k1PubkeyToRawAddress } from "@cosmjs/amino";
import { WALLET_AUTH_MESSAGE } from "./constants";

// ── Keplr signature verification ─────────────────────────────────────────────

async function verifyKeplrSignature(
  walletAddress: string,
  signatureBase64: string,
  message: string,
): Promise<boolean> {
  const { prefix, data: addrBytes } = fromBech32(walletAddress);
  if (addrBytes.length !== 20) return false;

  const msgData = Buffer.from(message).toString("base64");
  const signDoc = makeSignDoc(
    [{ type: "sign/MsgSignData", value: { signer: walletAddress, data: msgData } }],
    { gas: "0", amount: [] },
    "",
    "",
    0,
    0,
  );
  const hash = new Sha256(serializeSignDoc(signDoc)).digest();

  const sigBytes = fromBase64(signatureBase64);
  if (sigBytes.length !== 64) return false;
  const r = sigBytes.slice(0, 32);
  const s = sigBytes.slice(32);

  for (const recoveryParam of [0, 1] as const) {
    try {
      const extSig = new ExtendedSecp256k1Signature(r, s, recoveryParam);
      const uncompressed = Secp256k1.recoverPubkey(extSig, hash);
      const compressed = Secp256k1.compressPubkey(uncompressed);
      const rawAddr = rawSecp256k1PubkeyToRawAddress(compressed);
      if (toBech32(prefix, rawAddr) === walletAddress) return true;
    } catch {
      // try next recovery param
    }
  }
  return false;
}

// ── Providers ─────────────────────────────────────────────────────────────────

const KeplrProvider = CredentialsProvider({
  id: "keplr",
  name: "Keplr",
  credentials: {
    walletAddress: { label: "Wallet Address", type: "text" },
    signature: { label: "Signature", type: "text" },
    message: { label: "Message", type: "text" },
  },
  async authorize(credentials) {
    if (!credentials?.walletAddress || !credentials?.signature || !credentials?.message) {
      return null;
    }
    if (credentials.message !== WALLET_AUTH_MESSAGE) return null;

    const valid = await verifyKeplrSignature(
      credentials.walletAddress,
      credentials.signature,
      credentials.message,
    );
    if (!valid) return null;

    return {
      id: credentials.walletAddress,
      name: "Keplr Wallet",
      email: `${credentials.walletAddress}@keplr.wallet`,
      image: "/keplr.svg",
    };
  },
});

const MetaMaskProvider = CredentialsProvider({
  id: "metamask",
  name: "MetaMask",
  credentials: {
    walletAddress: { label: "Wallet Address", type: "text" },
    signature: { label: "Signature", type: "text" },
    message: { label: "Message", type: "text" },
  },
  async authorize(credentials) {
    if (!credentials?.walletAddress || !credentials?.signature || !credentials?.message) {
      return null;
    }
    if (credentials.message !== WALLET_AUTH_MESSAGE) return null;

    try {
      const { ethers } = await import("ethers");
      const recovered = ethers.verifyMessage(credentials.message, credentials.signature);
      const normalized = ethers.getAddress(credentials.walletAddress);
      if (ethers.getAddress(recovered) !== normalized) return null;

      return {
        id: normalized,
        name: "MetaMask Wallet",
        email: `${normalized}@metamask.wallet`,
        image: "/metamask.svg",
      };
    } catch {
      return null;
    }
  },
});

const EmailPasswordProvider = CredentialsProvider({
  id: "credentials",
  name: "Email and Password",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
  },
  async authorize(credentials) {
    if (!credentials?.email || !credentials?.password) return null;

    const user = await prisma.user.findUnique({
      where: { email: credentials.email.toLowerCase() },
    });

    if (!user?.passwordHash) return null;

    if (!user.emailConfirmed) {
      throw new Error("Please confirm your email address before signing in.");
    }

    const ok = await bcrypt.compare(credentials.password, user.passwordHash);
    if (!ok) return null;

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return { id: user.sub, name: user.email.split("@")[0], email: user.email };
  },
});

// ── NextAuth options ──────────────────────────────────────────────────────────

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: { prompt: "select_account", access_type: "offline", response_type: "code" },
      },
    }),
    EmailPasswordProvider,
    KeplrProvider,
    MetaMaskProvider,
  ],
  pages: {
    signIn: "/sign-in",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user }) {
      const email = user.email;
      if (email && !email.endsWith("@keplr.wallet") && !email.endsWith("@metamask.wallet")) {
        syncPortalAccount({ userSub: user.id, email }).catch(() => {});
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.provider = account?.provider ?? "credentials";
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session as any).provider = token.provider;
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
};
