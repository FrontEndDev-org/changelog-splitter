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
