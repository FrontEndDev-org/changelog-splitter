import { defineConfig } from 'vitest/config';
import pkg from './package.json' assert { type: 'json' };

export default defineConfig({
  test: {
    env: {
      PKG_NAME: pkg.name,
      PKG_VERSION: pkg.version,
    },
    include: ['test/**/*.test.ts'],
    coverage: {
      include: ['src/**/*.ts'],
      reporter: ['lcov', 'text'],
      // 包含所有源文件的覆盖率，而不是仅被单测的部分
      all: true,
    },
  },
});
