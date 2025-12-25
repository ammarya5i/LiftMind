/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    // Remove console.log, console.warn, console.debug in production
    // Keep console.error for error tracking
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error']
    } : false,
  },
  // Optimize bundle and speed up dev builds
  experimental: {
    optimizePackageImports: ['recharts', 'lucide-react', 'framer-motion', '@supabase/supabase-js'],
    // Enable parallel compilation (faster builds)
    webpackBuildWorker: true,
    // Optimize CSS imports
    optimizeCss: true,
  },
  // Set workspace root to avoid lockfile warnings
  outputFileTracingRoot: __dirname,
  
  // Custom webpack config for faster dev builds
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Speed up dev builds
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      }
      
      // Faster module resolution
      config.resolve = {
        ...config.resolve,
        symlinks: false,
      }
    }
    
    return config
  },
}

module.exports = nextConfig

