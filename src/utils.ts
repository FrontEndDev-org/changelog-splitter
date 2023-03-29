import fs from 'fs';
import path from 'path';
import readline from 'readline';

export function matchMajor(version: string) {
  return version.split('.')[0].replace(/\D/g, '');
}

export function matchVersion(line: string) {
  // [version](link) title (date)
  // [version](link) (date)
  // version title (date)
  // version (date)
  const matches = line.match(/^#+\s+(\S+)(.*?)\((.*?)\)/);

  if (!matches) return;

  const nameLink = matches[1].match(/\[(.*?)]\((.*?)\)/);
  const name = nameLink ? nameLink[1] : matches[1];
  const major = matchMajor(name);

  return {
    name,
    major,
    link: nameLink ? nameLink[2] : '',
    title: matches[2].trim(),
    date: matches[3],
  };
}

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

export function ensureFilePath(file: string, force?: boolean) {
  if (fs.existsSync(file) && !force) return;

  fs.mkdirSync(path.dirname(file), { recursive: true });
}

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

export async function countFileLines(filePath: string): Promise<number> {
  let count = 0;
  await readFileLineByLine(filePath, () => count++);
  return count;
}

export async function pipeFile(from: string, to: string) {
  return new Promise((resolve, reject) => {
    const rs = fs.createReadStream(from);
    const ws = fs.createWriteStream(to);
    rs.pipe(ws).on('error', reject).on('close', resolve);
  });
}
