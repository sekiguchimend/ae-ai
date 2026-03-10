/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@ae-ai/core', '@ae-ai/types'],
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;
