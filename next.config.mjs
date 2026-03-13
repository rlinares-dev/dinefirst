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
}

export default nextConfig
