import fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { pkgName, pkgVersion } from '../src/const';
import { ensureFilePath } from '../src/utils';

export function createFile(content = ''): [string, () => void] {
  const fileName = Math.random().toString(36) + '.txt';
  const filePath = path.join(os.tmpdir(), pkgName, pkgVersion, fileName);

  ensureFilePath(filePath);
  fs.writeFileSync(filePath, content, 'utf8');

  return [
    filePath,
    function clean() {
      fs.unlinkSync(filePath);
    },
  ];
}
