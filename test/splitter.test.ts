import fs from 'fs';
import { expect, test } from 'vitest';
import { defineConfig } from '../src';
import { splitChangelog } from '../src/splitter';
import { ChangelogFolder, makeChangelogCwd } from './helpers';

test('full test', async () => {
  const [cwd, clean] = makeChangelogCwd(ChangelogFolder.HasRefVersions);
  const { splitContext, runtimeConfig } = await splitChangelog(
    defineConfig({
      cwd,
    })
  );

  expect(fs.readFileSync(runtimeConfig.currentVersionChangeFilePath, 'utf8')).toMatchSnapshot();
  expect(Object.keys(splitContext.deprecatedMajorFiles)).toEqual(['9', '10']);

  clean();
});
