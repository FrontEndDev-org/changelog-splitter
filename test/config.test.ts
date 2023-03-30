import { expect, test } from 'vitest';
import { defaults, defineConfig } from '../src';

test('defineConfig', () => {
  const f = defineConfig();
  expect(f).toEqual(defaults);
});
