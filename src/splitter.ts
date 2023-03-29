import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { currentMajor, generatedSeparator, generatedSeparatorRE, pkgName, pkgVersion } from './const';
import { RuntimeConfig } from './types';
import { ensureFilePath, matchPrevious, matchVersion, pipeFile, readFileLineByLine } from './utils';

export async function split(config: RuntimeConfig) {
  const { cwd, previousVersionFileTitle, targetFile, sourceFile, previousVersionLinkTitle } = config;
  const resolvePath = (...p: string[]): string => path.resolve(cwd, ...p);
  const sourcePath = resolvePath(sourceFile);
  const currentMajorChangelogPath = path.join(os.tmpdir(), pkgName, pkgVersion, `CHANGELOG-${Date.now()}.md`);

  // 当前正在处理文件
  const processedFileByMajor: { [major: string]: string } = {};
  const blankLengthByMajor: { [major: string]: number } = {};

  const appendFile = (major: string, line: string) => {
    const isCurrentMajor = major === currentMajor;
    const filePath = isCurrentMajor ? currentMajorChangelogPath : resolvePath(targetFile.replace('[major]', major));

    ensureFilePath(filePath, !processedFileByMajor[major]);

    // 未处理过的大版本 && 不是当前版本 = 第一次处理旧版本更新日志
    if (!processedFileByMajor[major] && !isCurrentMajor) {
      fs.writeFileSync(filePath, `${generatedSeparator}\n\n`);

      // 旧版本标题
      if (previousVersionFileTitle) {
        const titleText = previousVersionFileTitle.replace('[major]', major);
        fs.appendFileSync(filePath, titleText + '\n\n');
      }
    }

    const blankLength = blankLengthByMajor[major] || 0;
    const isBlank = line.trim() === '';

    if (blankLength < 3 || !isBlank) {
      fs.appendFileSync(filePath, line + '\n');
    }

    blankLengthByMajor[major] = isBlank ? blankLength + 1 : 0;
    processedFileByMajor[major] = filePath;
  };

  let processingMajor = '';
  let processingPrevious = false;

  // title
  // version
  // ...
  // version
  // previousLink
  // ...
  // previousLink

  await readFileLineByLine(sourcePath, async (line) => {
    const isPreviousBlock = generatedSeparatorRE.test(line);

    // 前版本块
    if (isPreviousBlock) {
      processingPrevious = true;
      return;
    }

    // 处理前版本引用链接
    if (processingPrevious) {
      const previous = matchPrevious(line);

      if (previous && !processedFileByMajor[previous.major]) {
        processedFileByMajor[previous.major] = resolvePath(previous.link);
      }

      return;
    }

    const version = matchVersion(line);

    // 版本开始
    if (version) {
      processingMajor = version.major;
      appendFile(processingMajor, line);
    }
    // 版本区
    else if (processingMajor) {
      appendFile(processingMajor, line);
    }
    // 标题块
    else {
      appendFile(currentMajor, line);
    }
  });

  // 当前版本没有更新日志
  if (!fs.existsSync(currentMajorChangelogPath)) return;

  const prevVersions = Object.keys(processedFileByMajor)
    .filter((v) => v !== currentMajor)
    .map((v) => parseInt(v, 10))
    .sort((a, b) => b - a);

  if (!blankLengthByMajor[currentMajor]) {
    fs.appendFileSync(currentMajorChangelogPath, `\n\n`);
  }

  fs.appendFileSync(currentMajorChangelogPath, `${generatedSeparator}\n\n`);
  fs.appendFileSync(currentMajorChangelogPath, `${previousVersionLinkTitle}\n`);

  // 链接其他版本
  const fromDir = path.dirname(sourcePath);
  prevVersions.forEach((v) => {
    const filePath = processedFileByMajor[v];
    const relativePath = path.relative(fromDir, filePath);
    fs.appendFileSync(currentMajorChangelogPath, `- [v${v}.x](${relativePath})\n`);
  });

  fs.appendFileSync(currentMajorChangelogPath, '\n');

  await pipeFile(currentMajorChangelogPath, sourcePath);
}
