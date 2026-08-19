import { FlatCompat } from '@eslint/eslintrc';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const config = [
  // A config object containing only `ignores` sets them globally. Combined with
  // other keys they would apply to that one config block only.
  { ignores: ['.next/**', 'next-env.d.ts'] },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  prettierConfig,
  {
    plugins: { prettier: prettierPlugin },
    rules: {
      'prettier/prettier': 'error',
    },
  },
];

export default config;
