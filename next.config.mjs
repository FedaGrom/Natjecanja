/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimizacije za brži build
  experimental: {
    esmExternals: true,
    optimizeCss: true,
    optimizePackageImports: ['firebase', 'sweetalert2'],
  },
  
  // Optimizacije za sliku
  images: {
    unoptimized: true,
  },
  
  // Performance optimizations
  poweredByHeader: false,
  reactStrictMode: true,
  
  // Webpack optimizacije
  webpack: (config, { dev, isServer }) => {
    // Firebase optimizacije
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };

    // Optimizacije za bundle size
    if (!dev && !isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
      };
      
      // Tree shaking optimizacije
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
            firebase: {
              test: /[\\/]node_modules[\\/]firebase[\\/]/,
              name: 'firebase',
              chunks: 'all',
              priority: 20,
            },
          },
        },
      };
    }
    
    return config;
  },
  
  // Output optimizacije za Vercel
  output: 'standalone',
  
  // Transpile optimizacije
  transpilePackages: ['firebase'],
  
  // Compiler optimizacije
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
};

export default nextConfig;
