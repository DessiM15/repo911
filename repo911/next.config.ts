import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.replace(/\s/g, ''),
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, ''),
    RESEND_API_KEY: process.env.RESEND_API_KEY?.trim(),
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY?.trim(),
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET?.trim(),
  },
};

export default withSentryConfig(nextConfig, {
  // Suppresses source map upload logs during build
  silent: true,

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Automatically tree-shake Sentry debug logging
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
  },

  // Prevents source maps from being uploaded if no auth token is set
  authToken: process.env.SENTRY_AUTH_TOKEN,
});
