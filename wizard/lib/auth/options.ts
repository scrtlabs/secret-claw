import { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
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

    // TODO: Wire up your user database here (e.g. Prisma, Drizzle, or any
    // other ORM).  The devportal uses bcryptjs + Prisma – replicate that
    // pattern once a DB is provisioned for this project.
    //
    // Example skeleton:
    //   const user = await db.user.findUnique({ where: { email: credentials.email } });
    //   if (!user?.passwordHash) return null;
    //   const ok = await bcrypt.compare(credentials.password, user.passwordHash);
    //   if (!ok) return null;
    //   return { id: user.id, name: user.name, email: user.email };

    return null; // disabled until DB is configured
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
        params: { prompt: "consent", access_type: "offline", response_type: "code" },
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
