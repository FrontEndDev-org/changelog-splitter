import fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { pkgName, pkgVersion } from '../src/const';
import { ensureFileDirname } from '../src/utils';

/**
 * 创建临时文件
 * @param {string} content
 * @returns {[string, (() => void)]}
 */
export function createTempFile(content = ''): [string, () => void] {
  const fileName = Math.random().toString(36) + '.txt';
  const filePath = path.join(os.tmpdir(), pkgName, pkgVersion, fileName);

  ensureFileDirname(filePath);
  fs.writeFileSync(filePath, content, 'utf8');

  return [
    filePath,
    function clean() {
      fs.unlinkSync(filePath);
    },
  ];
}

export function wait(wait = 10) {
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve, wait);
  });
}
