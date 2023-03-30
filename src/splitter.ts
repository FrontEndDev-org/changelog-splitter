import * as fs from 'fs';
import * as path from 'path';
import { generatedSeparator, generatedSeparatorRE } from './const';
import { RuntimeConfig, SplitResult } from './types';
import { matchPrevious, matchVersion, pipeFile, readFileLineByLine } from './utils';

/**
 * 分离当前更新日志
 * @param {RuntimeConfig} config
 * @returns {Promise<void>}
 */
export async function splitCurrentChangelog(config: RuntimeConfig): Promise<SplitResult> {
  const {
    previousVersionChangelogTitle,
    previousVersionChangelogFileName,
    resolvePath,
    currentChangelogFilePath,
    currentMajor,
    currentMajorChangelogFilePath,
  } = config;

  const splitResult: SplitResult = {
    processedFileByMajor: {},
    blankLengthByMajor: {},
  };
  const { processedFileByMajor, blankLengthByMajor } = splitResult;

  const appendFile = (major: string, line: string) => {
    const isCurrentMajor = major === currentMajor;
    const filePath = isCurrentMajor
      ? currentMajorChangelogFilePath
      : resolvePath(previousVersionChangelogFileName.replace('[major]', major));

    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    // 第一次处理，清空其本身内容
    if (!processedFileByMajor[major]) {
      fs.writeFileSync(filePath, '');
    }

    // 未处理过的大版本 && 不是当前版本 = 第一次处理旧版本更新日志
    if (!processedFileByMajor[major] && !isCurrentMajor) {
      fs.writeFileSync(filePath, `${generatedSeparator}\n\n`);

      // 旧版本标题
      if (previousVersionChangelogTitle) {
        const titleText = previousVersionChangelogTitle.replace('[major]', major);
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

  await readFileLineByLine(currentChangelogFilePath, async (line) => {
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

  return splitResult;
}

/**
 * 引用之前的更新日志链接
 * @param {RuntimeConfig} config
 * @param {SplitResult} splitResult
 */
export async function referPreviousChangelog(config: RuntimeConfig, splitResult: SplitResult) {
  const { currentMajorChangelogFilePath, currentMajor, previousVersionLinkTitle, currentChangelogFilePath } = config;
  const { processedFileByMajor, blankLengthByMajor } = splitResult;

  // 当前版本没有更新日志
  if (!fs.existsSync(currentMajorChangelogFilePath)) return;

  const prevVersions = Object.keys(processedFileByMajor)
    .filter((v) => v !== currentMajor)
    .map((v) => parseInt(v, 10))
    .sort((a, b) => b - a);

  if (!blankLengthByMajor[currentMajor]) {
    fs.appendFileSync(currentMajorChangelogFilePath, `\n\n`);
  }

  fs.appendFileSync(currentMajorChangelogFilePath, `${generatedSeparator}\n\n`);
  fs.appendFileSync(currentMajorChangelogFilePath, `${previousVersionLinkTitle}\n`);

  // 链接其他版本
  const fromDir = path.dirname(currentChangelogFilePath);
  prevVersions.forEach((v) => {
    const filePath = processedFileByMajor[v];
    const relativePath = path.relative(fromDir, filePath);
    fs.appendFileSync(currentMajorChangelogFilePath, `- [v${v}.x](${relativePath})\n`);
  });

  fs.appendFileSync(currentMajorChangelogFilePath, '\n');

  await pipeFile(currentMajorChangelogFilePath, currentChangelogFilePath);
}
