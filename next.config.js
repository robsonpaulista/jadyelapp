/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
    ],
    domains: ['images.unsplash.com', 'placehold.co'],
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@/components/ui'],
  },
  compiler: {
    removeConsole: {
      exclude: ['error'], // Remove todos os console.log exceto errors críticos
    },
  },
  logging: {
    fetches: {
      fullUrl: false, // Não exibe URLs completas das requisições
    },
  },
  swcMinify: true,
  optimizeFonts: true,
};

module.exports = nextConfig; 