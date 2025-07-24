/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  typescript: {
    // 在构建时忽略 TypeScript 错误
    ignoreBuildErrors: false,
  },
  eslint: {
    // 在构建时忽略 ESLint 错误
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;