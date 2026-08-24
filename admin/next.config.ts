import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // The admin app is deployed on its own domain (admin.dainorelis.app) from a
  // subdirectory of the app repo, so Vercel needs this as the tracing root.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
