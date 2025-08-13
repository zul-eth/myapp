// next.config.ts (refactor)
const allowed = (process.env.NEXT_PUBLIC_BASE_URL ?? '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: allowed,
    },
  },
  reactStrictMode: true,
};
module.exports = nextConfig;
