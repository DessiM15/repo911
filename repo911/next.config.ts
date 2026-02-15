import type { NextConfig } from "next";

const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://*.supabase.co",
  "font-src 'self'",
  "connect-src 'self' https://*.supabase.co https://api.stripe.com",
  "frame-src https://js.stripe.com https://checkout.stripe.com",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: cspDirectives },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
];

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', 'zod', 'react-hook-form', '@hookform/resolvers', '@hello-pangea/dnd', '@tanstack/react-table'],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.replace(/\s/g, ''),
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, ''),
    RESEND_API_KEY: process.env.RESEND_API_KEY?.trim(),
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY?.trim(),
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET?.trim(),
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
