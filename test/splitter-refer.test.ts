import fs from 'fs';
import path from 'path';
import { expect, test } from 'vitest';
import { defineConfig } from '../src';
import { createRuntimeConfig } from '../src/config';
import { referPreviousChangelog, SplitResult } from '../src/splitter';
import { createTempDirname } from '../src/utils';
import { ChangelogFolder, makeChangelogCwd } from './helpers';

// test/changelogs
const testChangelogsPath = path.join(__dirname, 'changelogs');

test(ChangelogFolder.EmptyVersions, async () => {
  const cwd = makeChangelogCwd(ChangelogFolder.EmptyVersions);
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

test(ChangelogFolder.OnlyCurrentVersion, async () => {
  const cwd = makeChangelogCwd(ChangelogFolder.OnlyCurrentVersion);
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

test(ChangelogFolder.NotCurrentVersion, async () => {
  const cwd = makeChangelogCwd(ChangelogFolder.NotCurrentVersion);
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

test(ChangelogFolder.HasManyVersions, async () => {
  const cwd = makeChangelogCwd(ChangelogFolder.HasManyVersions);
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

test(ChangelogFolder.HasRefVersions, async () => {
  const cwd = makeChangelogCwd(ChangelogFolder.HasRefVersions);
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
