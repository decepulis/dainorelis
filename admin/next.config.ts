import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  // The admin app lives in a pnpm workspace with `nodeLinker: hoisted`, so its
  // dependencies are installed in the repo root's node_modules. The tracing
  // root has to be the repo root or Vercel's function bundles leave them out.
  outputFileTracingRoot: path.join(__dirname, '..'),
};

export default nextConfig;
