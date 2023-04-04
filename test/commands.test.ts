import fs from 'fs';
import { expect, test } from 'vitest';
import { defineConfig, run } from '../src';
import { splitChangelog } from '../src/splitter';
import { ChangelogFolder, makeChangelogCwd } from './helpers';

test('run', async () => {
  const [cwd, clean] = makeChangelogCwd(ChangelogFolder.HasRefVersions);

  await run({ cwd });
});
