import fs from 'fs';
import path from 'path';
import { expect, test, describe } from 'vitest';
import { ConflictStrategy, createRuntimeConfig, defineConfig } from '../src/config';
import { splitChangelog, splitCurrentChangelog } from '../src/splitter';
import { ChangelogFolder, makeChangelogCwd } from './helpers';

test('full test', async () => {
  const [cwd, clean] = makeChangelogCwd(ChangelogFolder.HasRefVersions);
  const result = await splitChangelog(
    defineConfig({
      cwd,
    })
  );

  expect(fs.readFileSync(result.runtimeConfig.currentVersionChangeFilePath, 'utf8')).toMatchSnapshot();
  expect(Object.keys(result.deprecatedMajorFiles)).toEqual(['9', '10']);

  clean();
});
