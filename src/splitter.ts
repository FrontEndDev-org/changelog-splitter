import * as fs from 'fs';
import * as path from 'path';
import { ConflictStrategy, createRuntimeConfig, RuntimeConfig, StrictUserConfig } from './config';
import { generatedSeparator, generatedSeparatorRE } from './const';
import { matchPrevious, matchVersion, pipeFile, readFileLineByLine } from './utils';

export interface SplitResult {
  /**
   * 已经处理的主版本号与文件的映射表
   */
  processedFileByMajor: { [major: string]: string };

  /**
   * 主版本更新日志末尾的连续空白长度
   */
  blankLengthByMajor: { [major: string]: number };
}

/**
 * 分离当前更新日志
 * @param {RuntimeConfig} config
 * @returns {Promise<void>}
 */
export async function splitCurrentChangelog(config: RuntimeConfig): Promise<SplitResult> {
  const {
    previousVersionChangelogTitle,
    previousVersionChangelogFileName,
    previousVersionChangelogConflictStrategy,
    resolvePath,
    currentChangelogFilePath,
    currentMajor,
    currentVersionChangeTempFilePath,
  } = config;

  const splitResult: SplitResult = {
    processedFileByMajor: {},
    blankLengthByMajor: {},
  };
  const { processedFileByMajor, blankLengthByMajor } = splitResult;

  const process = (major: string, line: string) => {
    const isCurrentMajor = major === currentMajor;
    const filePath = isCurrentMajor
      ? currentVersionChangeTempFilePath
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

    // 处理前版本引用链接，此时已经处理过更新日志中的所有版本了
    if (processingPrevious) {
      const previous = matchPrevious(line);

      if (!previous) return;

      const { link, major } = previous;
      // 旧文件
      const processedFile = resolvePath(link);
      // 新文件
      const processingFile = processedFileByMajor[major] || '';

      // 存在两份文件
      if (processingFile) {
        // 选择旧文件
        if (previousVersionChangelogConflictStrategy === ConflictStrategy.ProcessedFile) {
          processedFileByMajor[major] = processedFile;
        }
        // 选项新文件
        else {
          // processedFileByMajor[previous.major] = '';
        }
      } else {
        processedFileByMajor[major] = processedFile;
      }

      return;
    }

    const version = matchVersion(line);

    // 版本开始
    if (version) {
      processingMajor = version.major;
      process(processingMajor, line);
    }
    // 版本区
    else if (processingMajor) {
      process(processingMajor, line);
    }
    // 标题块
    else {
      process(currentMajor, line);
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
  const { currentVersionChangeTempFilePath, currentMajor, previousVersionLinkTitle, currentVersionChangeFilePath } =
    config;

  const { processedFileByMajor, blankLengthByMajor } = splitResult;
  const prevVersions = Object.keys(processedFileByMajor)
    .filter((v) => v !== currentMajor)
    .map((v) => parseInt(v, 10))
    .sort((a, b) => b - a);

  // 需要链接其他版本
  if (prevVersions.length > 0) {
    // 通常是存在的，为了便于单元测试时不存在
    if (!fs.existsSync(currentVersionChangeTempFilePath)) {
      fs.mkdirSync(path.dirname(currentVersionChangeTempFilePath), { recursive: true });
    }

    if (!blankLengthByMajor[currentMajor]) {
      fs.appendFileSync(currentVersionChangeTempFilePath, `\n\n`);
    }

    fs.appendFileSync(currentVersionChangeTempFilePath, `${generatedSeparator}\n\n`);
    fs.appendFileSync(currentVersionChangeTempFilePath, `${previousVersionLinkTitle}\n`);

    const currentDir = path.dirname(currentVersionChangeFilePath);
    prevVersions.forEach((v) => {
      const filePath = processedFileByMajor[v];
      const relativePath = path.relative(currentDir, filePath);
      fs.appendFileSync(currentVersionChangeTempFilePath, `- [v${v}.x](${relativePath})\n`);
    });

    fs.appendFileSync(currentVersionChangeTempFilePath, '\n');
  }

  // 通常是存在的，为了便于单元测试时不存在
  if (fs.existsSync(currentVersionChangeTempFilePath)) {
    // 复制当前大版本的更新日志临时文件回原地
    await pipeFile(currentVersionChangeTempFilePath, currentVersionChangeFilePath);
    fs.rmSync(currentVersionChangeTempFilePath);
  }
}

export async function splitChangelog(config: StrictUserConfig) {
  const runtimeConfig = createRuntimeConfig(config);
  const result = await splitCurrentChangelog(runtimeConfig);
  await referPreviousChangelog(runtimeConfig, result);
}
