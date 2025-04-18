/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  assetPrefix: '/',
  images: {
      loader: 'custom',
      loaderFile: './src/utils/imageLoader.ts',
      disableStaticImages: true,
  },
  // Configure static file serving for uploads
  outputFileTracingExcludes: {
      '**/uploads/**': ['*']
  },
  // Serve uploads from external directory
  async rewrites() {
      return [
          {
              source: '/uploads/:path*',
              destination: '/api/serve-upload/:path*'
          }
      ];
  },
  async headers() {
      return [];
  },
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    });
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  }
};

export default nextConfig;
