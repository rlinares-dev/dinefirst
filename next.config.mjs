/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Static export for mobile (Capacitor) builds — set MOBILE_BUILD=1
  ...(process.env.MOBILE_BUILD
    ? {
        output: 'export',
        images: { unoptimized: true },
      }
    : {}),

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=(self), interest-cohort=()',
          },
        ],
      },
    ]
  },

  // Permitir imágenes de Supabase Storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    ...(process.env.MOBILE_BUILD ? { unoptimized: true } : {}),
  },
}

export default nextConfig
