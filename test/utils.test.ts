import fs from 'fs';
import path from 'path';
import { expect, test } from 'vitest';
import {
  countFileLines,
  createTempDirname,
  generateNameByMajor,
  matchMajor,
  matchPrevious,
  matchVersion,
  pipeFile,
  readFileLineByLine,
} from '../src/utils';
import { createTempFile } from './helpers';

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

test('readFileLineByLine', async () => {
  const length = Math.floor(Math.random() * 50) + 10;
  const content = new Array(length)
    .fill('')
    .map((_, n) => `${n}`)
    .join('\n');
  const [file, clean] = createTempFile(content);
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
  const [file, clean] = createTempFile(content);
  const count = await countFileLines(file);
  expect(count).toEqual(length);
  clean();
});

test('pipeFile', async () => {
  const length = Math.floor(Math.random() * 50) + 10;
  const content = '\n'.repeat(length);
  const [source, clean1] = createTempFile(content);
  const [target, clean2] = createTempFile();
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
  const [source, clean1] = createTempFile(content1);
  const [target, clean2] = createTempFile(content2);
  await pipeFile(source, target);
  const st1 = fs.statSync(source);
  const st2 = fs.statSync(target);
  expect(st1.size).toEqual(st2.size);
  clean1();
  clean2();
});

test('generateNameByMajor', () => {
  expect(generateNameByMajor('1-[major]-[major]-3', '2')).toEqual('1-2-2-3');
});
