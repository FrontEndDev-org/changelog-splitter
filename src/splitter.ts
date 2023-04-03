import * as fs from 'fs';
import * as path from 'path';
import { ConflictStrategy, createRuntimeConfig, RuntimeConfig, StrictUserConfig } from './config';
import { generatedSeparator, generatedSeparatorRE } from './const';
import { SplitFault } from './fault';
import {
  createTempFile,
  generateNameByMajor,
  matchPrevious,
  matchVersion,
  mergeFiles,
  pipeFile,
  readFileLineByLine,
} from './utils';

export interface SplitResult {
  runtimeConfig: RuntimeConfig;

  /**
   * 已经处理的主版本号与文件的映射表
   */
  processedFileByMajor: { [major: string]: string };

  /**
   * 主版本更新日志末尾的连续空白长度
   */
  blankLengthByMajor: { [major: string]: number };

  /**
   * 由于冲突策略导致的废弃文件
   */
  deprecatedMajorFiles: { [major: string]: string };
}

/**
 * 分离当前更新日志
 * @param {RuntimeConfig} runtimeConfig
 * @returns {Promise<void>}
 */
export async function splitCurrentChangelog(runtimeConfig: RuntimeConfig): Promise<SplitResult> {
  const {
    previousVersionChangelogTitle,
    previousVersionChangelogFileName,
    previousVersionChangelogConflictStrategy,
    resolvePath,
    currentChangelogFilePath,
    currentMajor,
    currentVersionChangeTempFilePath,
  } = runtimeConfig;

  const splitResult: SplitResult = {
    runtimeConfig,
    processedFileByMajor: {},
    blankLengthByMajor: {},
    deprecatedMajorFiles: {},
  };
  const { processedFileByMajor, blankLengthByMajor, deprecatedMajorFiles } = splitResult;

  const process = (major: string, line: string) => {
    const isCurrentMajor = major === currentMajor;
    const filePath = isCurrentMajor
      ? currentVersionChangeTempFilePath
      : resolvePath(generateNameByMajor(previousVersionChangelogFileName, major));

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
        const titleText = generateNameByMajor(previousVersionChangelogTitle, major);
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
      const processingFile =
        processedFileByMajor[major] || resolvePath(generateNameByMajor(previousVersionChangelogFileName, major));
      // 是否存在两份旧版本文件
      const conflicting = processedFile !== processingFile;

      if (!conflicting) return;

      const existProcessingFile = fs.existsSync(processingFile);
      const existProcessedFile = fs.existsSync(processedFile);

      // 新旧文件同时存在：合并文件
      const acceptedFile =
        previousVersionChangelogConflictStrategy === ConflictStrategy.ProcessedFile
          ? (processedFileByMajor[major] = processedFile)
          : (processedFileByMajor[major] = processingFile);

      if (existProcessingFile && existProcessedFile) {
        const tempFile = createTempFile();
        await mergeFiles(
          [
            // 旧文件在前
            processedFile,
            // 新文件在后
            processingFile,
          ],
          tempFile
        );
        await pipeFile(tempFile, acceptedFile);
        if (processedFile !== acceptedFile) deprecatedMajorFiles[major] = processedFile;
      }
      // 只有旧文件
      else if (existProcessedFile) {
        await pipeFile(processedFile, acceptedFile);
        if (processedFile !== acceptedFile) deprecatedMajorFiles[major] = processedFile;
      } else {
        throw new SplitFault('LINK_CHANGELOG_NOT_FOUND', `链接的更新日志文件不存在 ${processedFile}`);
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
 * @param {RuntimeConfig} runtimeConfig
 * @param {SplitResult} splitResult
 */
export async function referPreviousChangelog(runtimeConfig: RuntimeConfig, splitResult: SplitResult) {
  const { currentVersionChangeTempFilePath, currentMajor, previousVersionLinkTitle, currentVersionChangeFilePath } =
    runtimeConfig;

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
  return result;
}
