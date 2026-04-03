import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/test/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: [
      'node_modules', 
      'dist', 
      '.idea', 
      '.git', 
      '.cache',
      'tests/**',
      'e2e/**',
      'server/node_modules/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/types/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/app/components'),
      '@utils': path.resolve(__dirname, './src/app/utils'),
      '@constants': path.resolve(__dirname, './src/constants'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
});
