import fs from 'fs';
import path from 'path';
import { expect, test, describe } from 'vitest';
import { defineConfig } from '../src';
import { createRuntimeConfig } from '../src/config';
import { splitCurrentChangelog, SplitResult } from '../src/splitter';
import { createTempDirname } from '../src/utils';
import { ChangelogFolder, makeChangelogCwd } from './helpers';

// test/changelogs
const testChangelogsPath = path.join(__dirname, 'changelogs');

function readSplitResultFile(splitResult: SplitResult, major: string) {
  return fs.readFileSync(splitResult.processedFileByMajor[major], 'utf8');
}

test(ChangelogFolder.EmptyVersions, async () => {
  const cwd = makeChangelogCwd(ChangelogFolder.EmptyVersions);
  const config = createRuntimeConfig(
    defineConfig({
      cwd,
    })
  );
  const currentChangelogOrigin = fs.readFileSync(config.currentChangelogFilePath, 'utf8');
  const result = await splitCurrentChangelog(config);
  const currentChangelogNow = fs.readFileSync(config.currentChangelogFilePath, 'utf8');

  expect(currentChangelogOrigin).toEqual(currentChangelogNow);
  expect(Object.keys(result.processedFileByMajor)).toEqual([]);
});

test(ChangelogFolder.OnlyCurrentVersion, async () => {
  const cwd = makeChangelogCwd(ChangelogFolder.OnlyCurrentVersion);
  const config = createRuntimeConfig(
    defineConfig({
      cwd,
    })
  );
  const currentChangelogOrigin = fs.readFileSync(config.currentChangelogFilePath, 'utf8');
  const result = await splitCurrentChangelog(config);
  const currentChangelogNow = fs.readFileSync(config.currentChangelogFilePath, 'utf8');

  expect(currentChangelogOrigin).toEqual(currentChangelogNow);
  expect(Object.keys(result.processedFileByMajor)).toEqual(['2']);
  expect(readSplitResultFile(result, '2')).toMatchSnapshot();
});

test(ChangelogFolder.NotCurrentVersion, async () => {
  const cwd = makeChangelogCwd(ChangelogFolder.NotCurrentVersion);
  const config = createRuntimeConfig(
    defineConfig({
      cwd,
    })
  );
  const result = await splitCurrentChangelog(config);

  expect(Object.keys(result.processedFileByMajor).sort()).toEqual(['2', '3']);
  expect(readSplitResultFile(result, '2')).toMatchSnapshot();
  expect(readSplitResultFile(result, '3')).toMatchSnapshot();
});

test(ChangelogFolder.HasManyVersions, async () => {
  const cwd = makeChangelogCwd(ChangelogFolder.HasManyVersions);
  const config = createRuntimeConfig(
    defineConfig({
      cwd,
    })
  );
  const result = await splitCurrentChangelog(config);

  expect(Object.keys(result.processedFileByMajor).sort()).toEqual(['14', '16', '2']);
  expect(readSplitResultFile(result, '14')).toMatchSnapshot();
  expect(readSplitResultFile(result, '16')).toMatchSnapshot();
  expect(readSplitResultFile(result, '2')).toMatchSnapshot();
});

test(ChangelogFolder.HasRefVersions, async () => {
  const cwd = makeChangelogCwd(ChangelogFolder.HasRefVersions);
  const config = createRuntimeConfig(
    defineConfig({
      cwd,
    })
  );
  const result = await splitCurrentChangelog(config);

  expect(Object.keys(result.processedFileByMajor).sort()).toEqual(['10', '14', '16', '2', '9']);
  expect(readSplitResultFile(result, '10')).toMatchSnapshot();
  expect(readSplitResultFile(result, '14')).toMatchSnapshot();
  expect(readSplitResultFile(result, '16')).toMatchSnapshot();
  expect(readSplitResultFile(result, '2')).toMatchSnapshot();
  expect(readSplitResultFile(result, '9')).toMatchSnapshot();

  expect(result.processedFileByMajor[9]).toEqual(path.join(config.cwd, '123.md'));
  expect(result.processedFileByMajor[10]).toEqual(path.join(config.cwd, '456.md'));
});
