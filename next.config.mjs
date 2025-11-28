/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimizacije za brži build
  experimental: {
    esmExternals: true,
  },
  
  // Optimizacije za sliku
  images: {
    unoptimized: true,
  },
  
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
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
