import path from 'path';
import { tryFlatten } from 'try-flatten';
import { describe, expect, test } from 'vitest';
import { createRuntimeConfig, defaults, defineConfig } from '../src';
import { ConfigFaultCode, ConfigFaultInstance } from '../src/fault';

test('defineConfig', () => {
  const f = defineConfig();
  expect(f).toEqual(defaults);
});

// test/changelogs
const cwd = path.join(__dirname, 'changelogs');

describe('createRuntimeConfig', () => {
  test('0-empty folder', () => {
    const [err] = tryFlatten(() =>
      createRuntimeConfig(
        defineConfig({
          cwd: path.join(cwd, '0-empty-folder'),
        })
      )
    );

    expect(err).not.toBeNull();

    if (err) {
      expect((err as ConfigFaultInstance).code).toBe<ConfigFaultCode>('CHANGELOG_NOT_FOUND');
    }
  });

  test('2-only-current-version', () => {
    const config = createRuntimeConfig(
      defineConfig({
        cwd: path.join(cwd, '2-only-current-version'),
      })
    );
    expect(config.currentMajor).toEqual('2');
  });
});
