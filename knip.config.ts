import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: [
    'src/router.tsx',
    'src/start.ts',
    'src/routes/**/*.{ts,tsx}',
    'src/**/*.test.{ts,tsx}',
    // Library-style modules whose exports form an intentional public API
    // consumed piecewise across feature components.
    'src/lib/glossary.tsx',
    'src/components/ImageViewer.tsx',
    'src/components/diabetes/shared.tsx',
    'vite.config.{ts,mts}',
    'eslint.config.{js,mjs,ts}',
    'knip.config.ts',
  ],
  project: ['src/**/*.{ts,tsx}'],
  ignore: [
    'src/routeTree.gen.ts',
    // shadcn primitives - keep the full set installed; individual files
    // are picked up on demand by feature code.
    'src/components/ui/**',
  ],
  ignoreExportsUsedInFile: true,
  ignoreDependencies: [
    // Tailwind v4 plugin-driven deps (not statically importable)
    'tw-animate-css',
    'tailwindcss',
    '@tailwindcss/vite',
    // Prettier + eslint-config-prettier are wired via eslint flat config
    'eslint-config-prettier',
    'eslint-plugin-prettier',
    'prettier',
    // TanStack router plugin registered inside @lovable.dev/vite-tanstack-config
    '@tanstack/router-plugin',
    // shadcn/ui peer libraries used exclusively by src/components/ui/** (ignored above)
    '@hookform/resolvers',
    'react-hook-form',
    'react-day-picker',
    'react-resizable-panels',
    'date-fns',
    'cmdk',
    'vaul',
    'zod',
    '@radix-ui/react-accordion',
    '@radix-ui/react-alert-dialog',
    '@radix-ui/react-aspect-ratio',
    '@radix-ui/react-avatar',
    '@radix-ui/react-collapsible',
    '@radix-ui/react-context-menu',
    '@radix-ui/react-dropdown-menu',
    '@radix-ui/react-hover-card',
    '@radix-ui/react-navigation-menu',
    '@radix-ui/react-progress',
    '@radix-ui/react-radio-group',
    '@radix-ui/react-scroll-area',
    '@radix-ui/react-slider',
    '@radix-ui/react-switch',
    '@radix-ui/react-toggle',
    '@radix-ui/react-toggle-group',
  ],
};

export default config;
