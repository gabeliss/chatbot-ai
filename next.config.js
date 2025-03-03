/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'localhost',
      'supabase.co',
    ],
  },
}

module.exports = nextConfig
