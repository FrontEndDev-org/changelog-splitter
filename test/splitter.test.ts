import fs from 'fs';
import { expect, test } from 'vitest';
import { defineConfig, splitChangelog } from '../src';
import { ChangelogFolder, makeChangelogCwd } from './helpers';

test('full test', async () => {
  const [cwd, clean] = makeChangelogCwd(ChangelogFolder.HasRefVersions);
  const { result, runtimeConfig } = await splitChangelog(
    defineConfig({
      cwd,
      onProcessing(processing) {
        console.log(processing);
      },
    })
  );

  expect(fs.readFileSync(runtimeConfig.currentVersionChangeFilePath, 'utf8')).toMatchSnapshot();
  expect(Object.keys(result.deprecatedMajorFiles)).toEqual(['9', '10']);

  clean();
});
