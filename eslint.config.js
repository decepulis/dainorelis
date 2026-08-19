// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const reactCompiler = require('eslint-plugin-react-compiler');
const prettierConfig = require('eslint-config-prettier');
const prettierPlugin = require('eslint-plugin-prettier');
const unusedImportsPlugin = require('eslint-plugin-unused-imports');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  reactCompiler.configs.recommended,
  {
    // admin/ is a Next.js app with its own ESLint config; Expo's rules do not apply there.
    ignores: ['dist/*', 'ios/*', 'android/*', '.expo/*', 'app-example/*', 'expo-env.d.ts', 'admin/*'],
    plugins: {
      prettier: prettierPlugin,
      'unused-imports': unusedImportsPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
      'import/no-unresolved': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },
]);
