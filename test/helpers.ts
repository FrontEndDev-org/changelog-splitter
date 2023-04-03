import fs from 'fs';
import * as path from 'path';
import { createTempDirname } from '../src/utils';

/**
 * 创建临时文件
 * @param {string} content
 * @returns {[string, (() => void)]}
 */
export function createTempFile(content = ''): [string, () => void, () => string] {
  const fileName = Math.random().toString(36) + '.txt';
  const filePath = path.join(createTempDirname(), fileName);

  fs.writeFileSync(filePath, content, 'utf8');

  return [
    filePath,
    function clean() {
      fs.unlinkSync(filePath);
    },
    function read() {
      return fs.readFileSync(filePath, 'utf8');
    },
  ];
}

export enum ChangelogFolder {
  EmptyVersions = '1-empty-versions',
  OnlyCurrentVersion = '2-only-current-version',
  NotCurrentVersion = '3-not-current-version',
  HasManyVersions = '4-has-many-versions',
  HasRefVersions = '5-has-ref-versions',
}

export function makeChangelogCwd(folder: ChangelogFolder) {
  // test/changelogs
  const testChangelogsPath = path.join(__dirname, 'changelogs');
  const cwd = createTempDirname();
  fs.cpSync(path.join(testChangelogsPath, folder), cwd, { recursive: true });
  return cwd;
}
