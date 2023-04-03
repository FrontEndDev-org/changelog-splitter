import fs from 'fs';
import path from 'path';
import { describe, expect, test } from 'vitest';
import { defineConfig } from '../src';
import { ConflictStrategy, createRuntimeConfig } from '../src/config';
import { parseCurrentChangelog } from '../src/splitter';
import { ChangelogFolder, makeChangelogCwd, readSplitResultFile } from './helpers';

test(ChangelogFolder.EmptyVersions, async () => {
  const [cwd, clean] = makeChangelogCwd(ChangelogFolder.EmptyVersions);
  const config = createRuntimeConfig(
    defineConfig({
      cwd,
    })
  );
  const currentChangelogOrigin = fs.readFileSync(config.currentChangelogFilePath, 'utf8');
  const result = await parseCurrentChangelog(config);
  const currentChangelogNow = fs.readFileSync(config.currentChangelogFilePath, 'utf8');

  expect(currentChangelogOrigin).toEqual(currentChangelogNow);
  expect(Object.keys(result.processedFileByMajor)).toEqual([]);
});

test(ChangelogFolder.OnlyCurrentVersion, async () => {
  const [cwd, clean] = makeChangelogCwd(ChangelogFolder.OnlyCurrentVersion);
  const config = createRuntimeConfig(
    defineConfig({
      cwd,
    })
  );
  const currentChangelogOrigin = fs.readFileSync(config.currentChangelogFilePath, 'utf8');
  const result = await parseCurrentChangelog(config);
  const currentChangelogNow = fs.readFileSync(config.currentChangelogFilePath, 'utf8');

  expect(currentChangelogOrigin).toEqual(currentChangelogNow);
  expect(Object.keys(result.processedFileByMajor)).toEqual(['2']);
  expect(readSplitResultFile(result, '2')).toMatchSnapshot();

  clean();
});

test(ChangelogFolder.NotCurrentVersion, async () => {
  const [cwd, clean] = makeChangelogCwd(ChangelogFolder.NotCurrentVersion);
  const config = createRuntimeConfig(
    defineConfig({
      cwd,
    })
  );
  const result = await parseCurrentChangelog(config);

  expect(Object.keys(result.processedFileByMajor).sort()).toEqual(['2', '3']);
  expect(readSplitResultFile(result, '2')).toMatchSnapshot();
  expect(readSplitResultFile(result, '3')).toMatchSnapshot();

  clean();
});

test(ChangelogFolder.HasManyVersions, async () => {
  const [cwd, clean] = makeChangelogCwd(ChangelogFolder.HasManyVersions);
  const config = createRuntimeConfig(
    defineConfig({
      cwd,
    })
  );
  const result = await parseCurrentChangelog(config);

  expect(Object.keys(result.processedFileByMajor).sort()).toEqual(['14', '16', '2']);
  expect(readSplitResultFile(result, '14')).toMatchSnapshot();
  expect(readSplitResultFile(result, '16')).toMatchSnapshot();
  expect(readSplitResultFile(result, '2')).toMatchSnapshot();

  clean();
});

describe(ChangelogFolder.HasRefVersions, () => {
  test('normal', async () => {
    const [cwd, clean] = makeChangelogCwd(ChangelogFolder.HasRefVersions);
    const config = createRuntimeConfig(
      defineConfig({
        cwd,
      })
    );
    const result = await parseCurrentChangelog(config);

    expect(Object.keys(result.processedFileByMajor).sort()).toEqual(['10', '14', '16', '2', '9']);
    expect(readSplitResultFile(result, '10')).toMatchSnapshot();
    expect(readSplitResultFile(result, '14')).toMatchSnapshot();
    expect(readSplitResultFile(result, '16')).toMatchSnapshot();
    expect(readSplitResultFile(result, '2')).toMatchSnapshot();
    expect(readSplitResultFile(result, '9')).toMatchSnapshot();

    expect(result.processedFileByMajor[9]).toEqual(path.join(config.cwd, 'changelogs/v9.x-CHANGELOG.md'));
    expect(result.processedFileByMajor[10]).toEqual(path.join(config.cwd, 'changelogs/v10.x-CHANGELOG.md'));

    clean();
  });

  test('accept processing file [default]', async () => {
    const [cwd, clean] = makeChangelogCwd(ChangelogFolder.HasRefVersions);
    const config = createRuntimeConfig(
      defineConfig({
        cwd,
      })
    );
    // [v10.x] => [v14.x]
    const changelog = fs.readFileSync(config.currentChangelogFilePath, 'utf8');
    fs.writeFileSync(config.currentChangelogFilePath, changelog.replace('[v10.x]', '[v14.x]'));
    const result = await parseCurrentChangelog(config);

    expect(result.processedFileByMajor[14]).toEqual(path.join(config.cwd, 'changelogs/v14.x-CHANGELOG.md'));
    expect(readSplitResultFile(result, '14')).toMatchSnapshot();
    expect(Object.keys(result.deprecatedMajorFiles)).toEqual(['9', '14']);
    expect(result.deprecatedMajorFiles[9]).toEqual(path.join(config.cwd, 'v9-old.md'));
    expect(result.deprecatedMajorFiles[14]).toEqual(path.join(config.cwd, 'v10-old.md'));

    clean();
  });

  test('accept processed file', async () => {
    const [cwd, clean] = makeChangelogCwd(ChangelogFolder.HasRefVersions);
    const config = createRuntimeConfig(
      defineConfig({
        cwd,
        previousVersionChangelogConflictStrategy: ConflictStrategy.ProcessedFile,
      })
    );
    // [v10.x] => [v14.x]
    const changelog = fs.readFileSync(config.currentChangelogFilePath, 'utf8');
    fs.writeFileSync(config.currentChangelogFilePath, changelog.replace('[v10.x]', '[v14.x]'));
    const result = await parseCurrentChangelog(config);

    expect(result.processedFileByMajor[14]).toEqual(path.join(config.cwd, 'v10-old.md'));
    expect(readSplitResultFile(result, '14')).toMatchSnapshot();
    expect(Object.keys(result.deprecatedMajorFiles)).toEqual([]);

    clean();
  });
});
