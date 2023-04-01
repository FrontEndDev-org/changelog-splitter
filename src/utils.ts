import fs from 'fs';
import os from 'os';
import path from 'path';
import readline from 'readline';
import { pkgName, pkgVersion } from './const';

/**
 * 匹配版本号中的主版本号
 * @param {string} version
 * @returns {string}
 */
export function matchMajor(version: string) {
  return version.split('.')[0].replace(/\D/g, '');
}

/**
 * 从 markdown 中匹配版本标题，例如
 * "## [12.34.56](http://example.com) A new version (2022-11-22)"
 * @param {string} line
 * @returns {{date: string, major: string, name: string, link: string, title: string}}
 */
export function matchVersion(line: string) {
  // ## [version](link) title (date)
  // ## [version](link) (date)
  // ## version title (date)
  // ## version (date)
  const matches = line.match(/^#+\s+(\S+)(.*?)(?:\((.*?)\)|$)/);

  if (!matches) return;

  const nameLink = matches[1].match(/\[(.*?)]\((.*?)\)/);
  const name = nameLink ? nameLink[1] : matches[1];
  const major = matchMajor(name);

  if (!major) return;

  return {
    name,
    major,
    link: nameLink ? nameLink[2] : '',
    title: matches[2].trim(),
    date: matches[3] || '',
  };
}

/**
 * 从 markdown 中匹配前版本链接，如：
 * - [v1.x](changelogs/v1.x.md)
 * @param {string} line
 * @returns {{major: string, name: string, link: string}}
 */
export function matchPrevious(line: string) {
  // - [version](file)
  const matches = line.match(/\[(.*?)]\((.*?)\)/);

  if (!matches) return;

  const name = matches[1];
  const major = matchMajor(name);

  return {
    name,
    major,
    link: matches[2],
  };
}

/**
 * 按行读取文件内容
 * @param {string} filePath
 * @param {(line: string) => any} lineProcessor
 * @returns {Promise<void>}
 */
export async function readFileLineByLine(filePath: string, lineProcessor: (line: string) => any) {
  const inputStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: inputStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    await lineProcessor(line);
  }
}

/**
 * 统计文件的行数
 * @param {string} filePath
 * @returns {Promise<number>}
 */
export async function countFileLines(filePath: string): Promise<number> {
  let count = 0;
  await readFileLineByLine(filePath, () => count++);
  return count;
}

/**
 * 流式复制文件
 * @param {string} source
 * @param {string} target
 * @returns {Promise<unknown>}
 */
export async function pipeFile(source: string, target: string) {
  return new Promise<void>((resolve, reject) => {
    const rs = fs.createReadStream(source);
    const ws = fs.createWriteStream(target);
    rs.pipe(ws).on('error', reject).on('close', resolve);
  });
}

/**
 * 创建临时目录【必存在】
 * @returns {string}
 */
export function createTempDirname() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), pkgName, pkgVersion) + '/');
  fs.mkdirSync(d, { recursive: true });
  return d;
}
