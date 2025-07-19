/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: 'standalone',
  generateEtags: true,
  // Habilitar Turbopack para desenvolvimento
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@/components/ui'],
    // Otimizações de performance
    optimizeServerReact: true,
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
  images: {
    unoptimized: false,
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
    domains: ['images.unsplash.com', 'placehold.co', 'firebasestorage.googleapis.com'],
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, max-age=0',
          },
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, max-age=0',
          },
          {
            key: 'Content-Type',
            value: 'application/manifest+json; charset=utf-8',
          },
        ],
      },
    ];
  },
  logging: {
    fetches: {
      fullUrl: false, // Não exibe URLs completas das requisições
    },
  },
  swcMinify: true,
  optimizeFonts: true,
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            svgo: true,
            svgoConfig: {
              plugins: [
                {
                  name: 'removeViewBox',
                  active: false,
                },
                {
                  name: 'removeXMLNS',
                  active: true,
                },
                {
                  name: 'removeDoctype',
                  active: true,
                },
                {
                  name: 'removeXMLProcInst',
                  active: true,
                },
                {
                  name: 'removeComments',
                  active: true,
                },
                {
                  name: 'removeMetadata',
                  active: true,
                },
                {
                  name: 'removeEditorsNSData',
                  active: true,
                },
              ],
            },
            replaceAttrValues: {
              'xml:space': 'xmlSpace',
            },
            jsx: {
              babelConfig: {
                plugins: [
                  [
                    '@babel/plugin-transform-react-jsx',
                    {
                      throwIfNamespace: false,
                    },
                  ],
              ],
              },
            },
          },
        },
      ],
    });
    return config;
  },
};

module.exports = nextConfig; 