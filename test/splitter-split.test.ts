import fs from 'fs';
import path from 'path';
import { expect, test, describe } from 'vitest';
import { createRuntimeConfig, defineConfig, splitCurrentChangelog, SplitResult } from '../src';
import { createTempDirname } from '../src/utils';

// test/changelogs
const testChangelogsPath = path.join(__dirname, 'changelogs');

function readSplitResultFile(splitResult: SplitResult, major: string) {
  return fs.readFileSync(splitResult.processedFileByMajor[major], 'utf8');
}

test('1-empty-versions', async () => {
  const tmpDirname = createTempDirname();
  const config = createRuntimeConfig(
    defineConfig({
      cwd: path.join(testChangelogsPath, '1-empty-versions'),
      previousVersionChangelogFileName: path.join(tmpDirname, '[major].md'),
    })
  );
  const currentChangelogOrigin = fs.readFileSync(config.currentChangelogFilePath, 'utf8');
  const result = await splitCurrentChangelog(config);
  const currentChangelogNow = fs.readFileSync(config.currentChangelogFilePath, 'utf8');

  expect(currentChangelogOrigin).toEqual(currentChangelogNow);
  expect(Object.keys(result.processedFileByMajor)).toEqual([]);
});

test('2-only-current-version', async () => {
  const tmpDirname = createTempDirname();
  const config = createRuntimeConfig(
    defineConfig({
      cwd: path.join(testChangelogsPath, '2-only-current-version'),
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

test('3-not-current-version', async () => {
  const tmpDirname = createTempDirname();
  const config = createRuntimeConfig(
    defineConfig({
      cwd: path.join(testChangelogsPath, '3-not-current-version'),
      previousVersionChangelogFileName: path.join(tmpDirname, '[major].md'),
    })
  );
  const result = await splitCurrentChangelog(config);

  expect(Object.keys(result.processedFileByMajor).sort()).toEqual(['2', '3']);
  expect(readSplitResultFile(result, '2')).toMatchSnapshot();
  expect(readSplitResultFile(result, '3')).toMatchSnapshot();
});

test('4-has-many-versions', async () => {
  const tmpDirname = createTempDirname();
  const config = createRuntimeConfig(
    defineConfig({
      cwd: path.join(testChangelogsPath, '4-has-many-versions'),
      previousVersionChangelogFileName: path.join(tmpDirname, '[major].md'),
    })
  );
  const result = await splitCurrentChangelog(config);

  expect(Object.keys(result.processedFileByMajor).sort()).toEqual(['14', '16', '2']);
  expect(readSplitResultFile(result, '14')).toMatchSnapshot();
  expect(readSplitResultFile(result, '16')).toMatchSnapshot();
  expect(readSplitResultFile(result, '2')).toMatchSnapshot();
});

test('5-has-ref-versions', async () => {
  const tmpDirname = createTempDirname();
  const config = createRuntimeConfig(
    defineConfig({
      cwd: path.join(testChangelogsPath, '5-has-ref-versions'),
      previousVersionChangelogFileName: path.join(tmpDirname, '[major].md'),
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
