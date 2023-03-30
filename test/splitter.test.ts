import fs from 'fs';
import path from 'path';
import { expect, test, describe } from 'vitest';
import { createRuntimeConfig, defineConfig, splitCurrentChangelog, SplitResult } from '../src';
import { createTempDirname } from '../src/utils';

// test/changelogs
const cwd = path.join(__dirname, 'changelogs');

function readSplitResultFile(splitResult: SplitResult, major: string) {
  return fs.readFileSync(splitResult.processedFileByMajor[major], 'utf8');
}

describe('splitCurrentChangelog', () => {
  test('only-current-version', async () => {
    const tmpDirname = createTempDirname();
    const config = createRuntimeConfig(
      defineConfig({
        cwd: path.join(cwd, 'only-current-version'),
        previousVersionChangelogFileName: path.join(tmpDirname, '[major].md'),
      })
    );
    const currentChangelogOrigin = fs.readFileSync(config.currentChangelogFilePath, 'utf8');
    const result = await splitCurrentChangelog(config);
    const currentChangelogNow = fs.readFileSync(config.currentChangelogFilePath, 'utf8');

    expect(currentChangelogOrigin).toEqual(currentChangelogNow);
    expect(Object.keys(result.processedFileByMajor)).toEqual(['2']);
    expect(readSplitResultFile(result, '2')).toMatchSnapshot();
  });

  test('not-current-version', async () => {
    const tmpDirname = createTempDirname();
    const config = createRuntimeConfig(
      defineConfig({
        cwd: path.join(cwd, 'not-current-version'),
        previousVersionChangelogFileName: path.join(tmpDirname, '[major].md'),
      })
    );
    const result = await splitCurrentChangelog(config);

    expect(Object.keys(result.processedFileByMajor).sort()).toEqual(['2', '3']);
    expect(readSplitResultFile(result, '2')).toMatchSnapshot();
    expect(readSplitResultFile(result, '3')).toMatchSnapshot();
  });

  test('has-many-versions', async () => {
    const tmpDirname = createTempDirname();
    const config = createRuntimeConfig(
      defineConfig({
        cwd: path.join(cwd, 'has-many-versions'),
        previousVersionChangelogFileName: path.join(tmpDirname, '[major].md'),
      })
    );
    const result = await splitCurrentChangelog(config);

    expect(Object.keys(result.processedFileByMajor).sort()).toEqual(['14', '16', '2']);
    expect(readSplitResultFile(result, '14')).toMatchSnapshot();
    expect(readSplitResultFile(result, '16')).toMatchSnapshot();
    expect(readSplitResultFile(result, '2')).toMatchSnapshot();
  });
});
