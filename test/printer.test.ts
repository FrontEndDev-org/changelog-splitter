import path from 'path';
import { expect, test } from 'vitest';
import { Printer } from '../src/printer.class';

test('Printer', () => {
  const cwd = '/path/to/dir';
  const resolvePath = (...to: string[]) => path.join(cwd, ...to);
  const printer = new Printer(cwd);

  printer.insertFile(resolvePath('index.js'));
  printer.insertFile(resolvePath('src/index.js'));
  printer.insertFile(resolvePath('src/index.js'));
  printer.removeFile(resolvePath('src/index2.js'));
  printer.updateFile(resolvePath('src/index3.js'));

  expect(printer.counts.insertFiles.size).toBe(2);
  expect(printer.counts.updateFiles.size).toBe(1);
  expect(printer.counts.removeFiles.size).toBe(1);
});
