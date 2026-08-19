// TypeScript 6 rejects side-effect imports it has no declaration for, and
// Next's bundled types don't cover stylesheet imports.
declare module '*.css';
