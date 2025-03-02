/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'localhost',
      'supabase.co',
    ],
  },
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig
