import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    exclude: ['tests/firestore.rules.test.ts', '**/node_modules/**', '**/dist/**']
  }
});
