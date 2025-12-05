/** @type {import('next').NextConfig} */
const nextConfig = {
  // Osnovne optimizacije
  experimental: {
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

    // Optimizacije za bundle size samo u produkciji
    if (!dev && !isServer) {      
      // Tree shaking optimizacije
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
      };
    }
    
    return config;
  },
  
  // Output optimizacije za Vercel
  output: 'standalone',
  
  // Compiler optimizacije
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
};

export default nextConfig;
