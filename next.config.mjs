/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Ensure proper static generation
  output: 'standalone',
  // Handle Prisma client generation
  experimental: {
    serverComponentsExternalPackages: []
  }
}

export default nextConfig
