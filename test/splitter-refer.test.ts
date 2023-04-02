import fs from 'fs';
import path from 'path';
import { expect, test, describe } from 'vitest';
import { createRuntimeConfig, defineConfig, referPreviousChangelog, splitCurrentChangelog, SplitResult } from '../src';
import { createTempDirname } from '../src/utils';

// test/changelogs
const testChangelogsPath = path.join(__dirname, 'changelogs');

test('1-empty-versions', async () => {
  const cwd = createTempDirname();
  fs.cpSync(path.join(testChangelogsPath, '1-empty-versions'), cwd, { recursive: true });
  const config = createRuntimeConfig(
    defineConfig({
      cwd,
    })
  );
  const { currentVersionChangeFilePath } = config;
  const splitResult: SplitResult = {
    processedFileByMajor: {},
    blankLengthByMajor: {},
  };

  await referPreviousChangelog(config, splitResult);
  expect(fs.readFileSync(currentVersionChangeFilePath, 'utf8')).toMatchSnapshot();
});

test('2-only-current-version', async () => {
  const cwd = createTempDirname();
  fs.cpSync(path.join(testChangelogsPath, '2-only-current-version'), cwd, { recursive: true });
  const config = createRuntimeConfig(
    defineConfig({
      cwd,
    })
  );
  const { currentMajor, resolvePath, currentVersionChangeFilePath } = config;
  const splitResult: SplitResult = {
    processedFileByMajor: {
      [currentMajor]: resolvePath('123.md'),
    },
    blankLengthByMajor: {},
  };
  await referPreviousChangelog(config, splitResult);
  // 空
  expect(fs.readFileSync(currentVersionChangeFilePath, 'utf8')).toMatchSnapshot();
});

test('3-not-current-version', async () => {
  const cwd = createTempDirname();
  fs.cpSync(path.join(testChangelogsPath, '3-not-current-version'), cwd, { recursive: true });
  const config = createRuntimeConfig(
    defineConfig({
      cwd,
    })
  );
  const { resolvePath, currentVersionChangeFilePath } = config;
  const splitResult: SplitResult = {
    processedFileByMajor: {
      2: resolvePath('123.md'),
    },
    blankLengthByMajor: {},
  };

  await referPreviousChangelog(config, splitResult);
  // 1 个引用链接
  expect(fs.readFileSync(currentVersionChangeFilePath, 'utf8')).toMatchSnapshot();
});

test('4-has-many-versions', async () => {
  const cwd = createTempDirname();
  fs.cpSync(path.join(testChangelogsPath, '4-has-many-versions'), cwd, { recursive: true });
  const config = createRuntimeConfig(
    defineConfig({
      cwd,
    })
  );
  const { resolvePath, currentVersionChangeFilePath } = config;
  const splitResult: SplitResult = {
    processedFileByMajor: {
      2: resolvePath('123.md'),
      14: resolvePath('456.md'),
      16: resolvePath('789.md'),
    },
    blankLengthByMajor: {},
  };
  await referPreviousChangelog(config, splitResult);
  // 3 个引用链接
  expect(fs.readFileSync(currentVersionChangeFilePath, 'utf8')).toMatchSnapshot();
});
