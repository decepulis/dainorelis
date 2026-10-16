import type { NextConfig } from 'next';
import path from 'node:path';

// The admin app lives in a pnpm workspace with `nodeLinker: hoisted`, so its
// dependencies are installed in the repo root's node_modules.
const repoRoot = path.join(__dirname, '..');

const nextConfig: NextConfig = {
  // The tracing root has to be the repo root or Vercel's function bundles
  // leave the dependencies out.
  outputFileTracingRoot: repoRoot,
  // Turbopack (the default bundler in Next 16) infers its root from lockfiles
  // and would otherwise disagree with the tracing root; pin the two together.
  turbopack: { root: repoRoot },
};

export default nextConfig;
