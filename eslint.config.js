import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import astro from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: [
      '**/.astro/**',
      'dist/**',
      'node_modules/**',
      'artifacts/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    files: ['**/*.d.ts'],
    rules: { '@typescript-eslint/triple-slash-reference': 'off' },
  },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        Buffer: 'readonly',
        URL: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        process: 'readonly',
        AudioContext: 'readonly',
        navigator: 'readonly',
        performance: 'readonly',
      },
    },
  },
  {
    files: ['src/sw/**/*.js'],
    languageOptions: {
      globals: {
        URL: 'readonly',
        self: 'readonly',
        caches: 'readonly',
        indexedDB: 'readonly',
        crypto: 'readonly',
        setTimeout: 'readonly',
        fetch: 'readonly',
        Response: 'readonly',
        clearTimeout: 'readonly',
        sharedIdea: 'readonly',
        shareRedirect: 'readonly',
      },
    },
  },
);
