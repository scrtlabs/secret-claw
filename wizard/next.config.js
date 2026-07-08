/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  // Standalone output produces a self-contained server bundle at
  // .next/standalone/server.js for the Dockerfile to copy. Vercel does
  // its own serverless packaging — forcing standalone there confuses its
  // build orchestration and can fail the build before it starts. Vercel
  // exports VERCEL=1 during build, so we branch off it: skip standalone
  // on Vercel, keep it everywhere else (Docker, SecretVM, local).
  ...(process.env.VERCEL ? {} : { output: "standalone" }),
};

module.exports = nextConfig;
