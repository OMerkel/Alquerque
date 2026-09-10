import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.js'],
    environment: 'node',
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      include: ['html5/src/js/**/*.js'],
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        statements: 96,
        branches: 96,
        functions: 96,
        lines: 96
      }
    }
  }
});
