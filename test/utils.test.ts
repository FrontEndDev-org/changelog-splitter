import fs from 'fs';
import path from 'path';
import { expect, test } from 'vitest';
import {
  countFileLines,
  createTempDirname,
  createTempFile,
  generateNameByMajor,
  matchMajor,
  matchPrevious,
  matchVersion,
  mergeFiles,
  pipeFile,
  readFileLineByLine,
  versionListSort,
} from '../src/utils';
import { makeTempFile } from './helpers';

test('matchMajor', () => {
  expect(matchMajor('0')).toEqual('0');
  expect(matchMajor('v0')).toEqual('0');
  expect(matchMajor('v0.1.2')).toEqual('0');
  expect(matchMajor('v10.1.2')).toEqual('10');
});

test('matchVersion', () => {
  expect(matchVersion('')).toBeUndefined();
  expect(matchVersion('# balabala')).toBeUndefined();
  expect(matchVersion('# [12.34.56](L) T (D)')).toEqual({
    name: '12.34.56',
    major: '12',
    link: 'L',
    title: 'T',
    date: 'D',
  });
  expect(matchVersion('# 12.34.56 T (D)')).toEqual({
    name: '12.34.56',
    major: '12',
    link: '',
    title: 'T',
    date: 'D',
  });
  expect(matchVersion('# [12.34.56](L) (D)')).toEqual({
    name: '12.34.56',
    major: '12',
    link: 'L',
    title: '',
    date: 'D',
  });
  expect(matchVersion('# 12.34.56 (D)')).toEqual({
    name: '12.34.56',
    major: '12',
    link: '',
    title: '',
    date: 'D',
  });
  expect(matchVersion('# [12.34.56](L)')).toEqual({
    name: '12.34.56',
    major: '12',
    link: 'L',
    title: '',
    date: '',
  });
  expect(matchVersion('# 12.34.56')).toEqual({
    name: '12.34.56',
    major: '12',
    link: '',
    title: '',
    date: '',
  });
});

test('matchPrevious', () => {
  const link = 'path/to/changelogs/v78.x.md';
  expect(matchPrevious(`- [v78.x](${link})`)).toEqual({
    name: 'v78.x',
    major: '78',
    link,
  });
});

test('createTempDirname', () => {
  const d = createTempDirname();
  expect(fs.existsSync(d)).toBeTruthy();
});

test('createTempFile', () => {
  const f1 = createTempFile();
  expect(fs.readFileSync(f1, 'utf8')).toEqual('');

  const f2 = createTempFile('1');
  expect(fs.readFileSync(f2, 'utf8')).toEqual('1');

  expect(f1).not.toEqual(f2);

  fs.rmSync(f1);
  fs.rmSync(f2);
});

test('readFileLineByLine', async () => {
  const length = Math.floor(Math.random() * 50) + 10;
  const content = new Array(length)
    .fill('')
    .map((_, n) => `${n}`)
    .join('\n');
  const [file, clean] = makeTempFile(content);
  const lines: string[] = [];
  await readFileLineByLine(file, async (line) => {
    await Promise.resolve();
    lines.push(line);
  });
  expect(lines).toHaveLength(length);
  expect(lines.at(0)).toEqual('0');
  clean();
});

test('countFileLines', async () => {
  const length = Math.floor(Math.random() * 50) + 10;
  const content = '\n'.repeat(length);
  const [file, clean] = makeTempFile(content);
  const count = await countFileLines(file);
  expect(count).toEqual(length);
  clean();
});

test('pipeFile', async () => {
  const length = Math.floor(Math.random() * 50) + 10;
  const content = '\n'.repeat(length);

  const [source, clean1] = makeTempFile(content);
  const [target, clean2] = makeTempFile();

  await pipeFile(source, target);

  const st1 = fs.statSync(source);
  const st2 = fs.statSync(target);

  expect(st1.size).toEqual(st2.size);

  clean1();
  clean2();
});

test('pipeFile exitFile', async () => {
  const length = Math.floor(Math.random() * 50) + 10;

  const content1 = '1\n'.repeat(length);
  const content2 = '2\n'.repeat(length);

  const [source, clean1] = makeTempFile(content1);
  const [target, clean2] = makeTempFile(content2);

  await pipeFile(source, target);

  const st1 = fs.statSync(source);
  const st2 = fs.statSync(target);

  expect(st1.size).toEqual(st2.size);

  clean1();
  clean2();
});

test('pipeFile not exitFile', async () => {
  const length = Math.floor(Math.random() * 50) + 10;

  const content1 = '1\n'.repeat(length);

  const [source, clean1] = makeTempFile(content1);
  const target = path.join(createTempDirname(), Date.now() + '.txt');

  await pipeFile(source, target);

  const st1 = fs.statSync(source);
  const st2 = fs.statSync(target);

  expect(st1.size).toEqual(st2.size);

  clean1();
  fs.rmSync(target);
});

test('pipeFile same file', async () => {
  const data = Date.now().toString();
  const [source, clean] = makeTempFile(data);

  await pipeFile(source, source);

  expect(fs.readFileSync(source, 'utf8')).toEqual(data);

  clean();
});

test('generateNameByMajor', () => {
  expect(generateNameByMajor('1-[major]-[major]-3', '2')).toEqual('1-2-2-3');
});

test('mergeFiles', async () => {
  const t1 = '1\n2\n';
  const [f1, c1] = makeTempFile(t1);
  const t2 = '3\n4\n';
  const [f2, c2] = makeTempFile(t2);
  const [f3, c3, r3] = makeTempFile();
  await mergeFiles([f1, f2], f3);
  expect(r3()).toEqual(t1 + t2);
  c1();
  c2();
  c3();
});

test('versionListSort', () => {
  expect(versionListSort(['2.0.0', '1.2.3', '1.2.4', '2.1.1'])).toEqual(['1.2.3', '1.2.4', '2.0.0', '2.1.1']);
  expect(versionListSort(['2.0.0', '1.2.3', '1.2.4', '2.1.1'], true)).toEqual(['2.1.1', '2.0.0', '1.2.4', '1.2.3']);
  expect(versionListSort(['2', '2.1'], true)).toEqual(['2.1', '2']);
});
