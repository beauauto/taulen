/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  // Enable Fast Refresh (HMR) - this is enabled by default but explicitly set for clarity
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Ensure HMR is working properly
      config.watchOptions = {
        poll: 1000, // Check for changes every second
        aggregateTimeout: 300, // Delay before rebuilding once the first file changed
      }
    }
    return config
  },
}

module.exports = nextConfig
