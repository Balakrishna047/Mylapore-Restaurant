/** @type {import('next').NextConfig} */
const rawApiUrl = process.env.API_URL || 'http://localhost:4000';
const normalizedUrl = rawApiUrl.startsWith('http') ? rawApiUrl : `http://${rawApiUrl}:4000`;
const apiUrl = normalizedUrl.endsWith('/api/v1') ? normalizedUrl : `${normalizedUrl.replace(/\/+$/, '')}/api/v1`;

const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiUrl}/:path*`
      }
    ];
  }
};

module.exports = nextConfig;
