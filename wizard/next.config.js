/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Produces a self-contained server bundle at .next/standalone/server.js
  // along with a pruned node_modules tree. Used by the production
  // Dockerfile so the final image needs only the standalone artifacts,
  // not the full dev tree.
  output: "standalone",
};

module.exports = nextConfig;
