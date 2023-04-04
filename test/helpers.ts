import fs from 'fs';
import * as path from 'path';
import { SplitContext } from '../src/splitter';
import { createTempDirname, createTempFile } from '../src/utils';

/**
 * 创建临时文件
 * @param {string} data
 * @returns {[string, (() => void)]}
 */
export function makeTempFile(data = '') {
  const filePath = createTempFile(data);

  return [
    filePath,
    function clean() {
      fs.rmSync(filePath, { force: true });
    },
    function read() {
      return fs.readFileSync(filePath, 'utf8');
    },
  ] as const;
}

export enum ChangelogFolder {
  EmptyVersions = '1-empty-versions',
  OnlyCurrentVersion = '2-only-current-version',
  NotCurrentVersion = '3-not-current-version',
  HasManyVersions = '4-has-many-versions',
  HasRefVersions = '5-has-ref-versions',
}

/**
 * 创建更新日志的工作目录
 * @param {ChangelogFolder} folder
 * @returns {(string | (() => void))[]}
 */
export function makeChangelogCwd(folder: ChangelogFolder) {
  // test/changelogs
  const testChangelogsPath = path.join(__dirname, 'changelogs');
  const cwd = createTempDirname();
  fs.cpSync(path.join(testChangelogsPath, folder), cwd, { recursive: true });
  return [
    cwd,
    function clean() {
      fs.rmSync(cwd, { force: true, recursive: true });
    },
  ] as const;
}

export function readSplitResultFile(splitResult: SplitContext, major: string) {
  return fs.readFileSync(splitResult.processedFileByMajor[major], 'utf8');
}
