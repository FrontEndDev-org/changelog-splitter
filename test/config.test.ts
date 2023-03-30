import path from 'path';
import { expect, test } from 'vitest';
import { createRuntimeConfig, defaults, defineConfig } from '../src';

test('defineConfig', () => {
  const f = defineConfig();
  expect(f).toEqual(defaults);
});

test('createRuntimeConfig', () => {
  // test/changelogs
  const cwd = path.join(__dirname, 'changelogs');
  const config = createRuntimeConfig(
    defineConfig({
      cwd: path.join(cwd, 'only-current-version'),
    })
  );
  expect(config.currentMajor).toEqual('2');
});
