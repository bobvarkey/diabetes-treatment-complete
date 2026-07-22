import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: [
    'src/router.tsx',
    'src/start.ts',
    'src/routes/**/*.{ts,tsx}',
    'src/**/*.test.{ts,tsx}',
    'vite.config.{ts,mts}',
    'eslint.config.{js,mjs,ts}',
  ],
  project: ['src/**/*.{ts,tsx}'],
  ignore: [
    'src/routeTree.gen.ts',
    'src/components/ui/**', // shadcn primitives - keep the full set even if unused today
  ],
  ignoreDependencies: [
    // Tailwind v4 / plugin-driven deps that knip can't statically detect
    'tw-animate-css',
    'tailwindcss',
    '@tailwindcss/vite',
    // Peer/transitive tooling used via config
    'eslint-config-prettier',
    'eslint-plugin-prettier',
    'prettier',
  ],
  ignoreBinaries: ['tsgo'],
};

export default config;
