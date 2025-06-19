/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Remove ignoreBuildErrors to ensure proper type checking
  },
  images: {
    unoptimized: true,
  }
}

export default nextConfig;
