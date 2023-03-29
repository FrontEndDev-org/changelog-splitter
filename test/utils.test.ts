import { expect, test } from 'vitest';
import { countFileLines } from '../src/utils';
import { createFile } from './utils';

test('countFileLines', async () => {
  const length = Math.floor(Math.random() * 100);
  const content = '\n'.repeat(length);
  const [file, clean] = createFile(content);
  const count = await countFileLines(file);
  expect(count).toEqual(length);
  clean();
});
