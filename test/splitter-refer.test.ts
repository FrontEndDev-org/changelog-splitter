import fs from 'fs';
import { expect, test } from 'vitest';
import { defineConfig } from '../src';
import { createRuntimeConfig } from '../src/config';
import { referPreviousChangelog, SplitResult } from '../src/splitter';
import { ChangelogFolder, makeChangelogCwd } from './helpers';

test(ChangelogFolder.EmptyVersions, async () => {
  const [cwd, clean] = makeChangelogCwd(ChangelogFolder.EmptyVersions);
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

  clean();
});

test(ChangelogFolder.OnlyCurrentVersion, async () => {
  const [cwd, clean] = makeChangelogCwd(ChangelogFolder.OnlyCurrentVersion);
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

  clean();
});

test(ChangelogFolder.NotCurrentVersion, async () => {
  const [cwd, clean] = makeChangelogCwd(ChangelogFolder.NotCurrentVersion);
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

  clean();
});

test(ChangelogFolder.HasManyVersions, async () => {
  const [cwd, clean] = makeChangelogCwd(ChangelogFolder.HasManyVersions);
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

  clean();
});

test(ChangelogFolder.HasRefVersions, async () => {
  const [cwd, clean] = makeChangelogCwd(ChangelogFolder.HasRefVersions);
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

  clean();
});
