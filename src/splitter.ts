import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';
import { ConflictStrategy, createRuntimeConfig, RuntimeConfig, StrictUserConfig } from './config';
import { generatedSeparator, generatedSeparatorRE } from './const';
import { SplitFault } from './fault';
import {
  countFileLines,
  createTempFile,
  generateNameByMajor,
  matchPrevious,
  matchVersion,
  mergeFiles,
  pipeFile,
  readFileLineByLine,
} from './utils';

export enum SplitProcessingStage {
  Parse,
  Refer,
}

export interface SplitProcessing {
  stage: SplitProcessingStage;
  progress: number;
}

export type OnProcessing = (processing: SplitProcessing) => void;

export interface SplitContext {
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

export interface SplitResult {
  splitContext: SplitContext;
  runtimeConfig: RuntimeConfig;
}

export function createSplitContext(): SplitContext {
  return {
    processedFileByMajor: {},
    blankLengthByMajor: {},
    deprecatedMajorFiles: {},
  };
}

/**
 * 分离当前更新日志
 * @param {RuntimeConfig} runtimeConfig
 * @param {OnProcessing} [onProcessing]
 * @returns {Promise<SplitContext>}
 */
export async function parseCurrentChangelog(
  runtimeConfig: RuntimeConfig,
  onProcessing?: OnProcessing
): Promise<SplitContext> {
  const {
    previousVersionChangelogTitle,
    previousVersionChangelogFileName,
    previousVersionChangelogConflictStrategy,
    resolvePath,
    currentChangelogFilePath,
    currentMajor,
    currentVersionChangeTempFilePath,
  } = runtimeConfig;

  const splitContext = createSplitContext();
  const { processedFileByMajor, blankLengthByMajor, deprecatedMajorFiles } = splitContext;

  const process = async (major: string, line: string) => {
    const isCurrentMajor = major === currentMajor;
    const filePath = isCurrentMajor
      ? currentVersionChangeTempFilePath
      : resolvePath(generateNameByMajor(previousVersionChangelogFileName, major));

    await fsp.mkdir(path.dirname(filePath), { recursive: true });

    // 第一次处理，清空其本身内容
    if (!processedFileByMajor[major]) {
      await fsp.writeFile(filePath, '');
    }

    // 未处理过的大版本 && 不是当前版本 = 第一次处理旧版本更新日志
    if (!processedFileByMajor[major] && !isCurrentMajor) {
      await fsp.writeFile(filePath, `${generatedSeparator}\n\n`);

      // 旧版本标题
      if (previousVersionChangelogTitle) {
        const titleText = generateNameByMajor(previousVersionChangelogTitle, major);
        await fsp.appendFile(filePath, titleText + '\n\n');
      }
    }

    const blankLength = blankLengthByMajor[major] || 0;
    const isBlank = line.trim() === '';

    if (blankLength < 3 || !isBlank) {
      await fsp.appendFile(filePath, line + '\n');
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

  const count = await countFileLines(currentChangelogFilePath);
  let lines = 0;
  await readFileLineByLine(currentChangelogFilePath, async (line) => {
    lines++;
    onProcessing?.({
      stage: SplitProcessingStage.Parse,
      progress: lines / count,
    });

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

  return splitContext;
}

/**
 * 引用之前的更新日志链接
 * @param {RuntimeConfig} runtimeConfig
 * @param {SplitContext} splitContext
 * @param {OnProcessing} onProcessing
 * @returns {Promise<void>}
 */
export async function referPreviousChangelog(
  runtimeConfig: RuntimeConfig,
  splitContext: SplitContext,
  onProcessing?: OnProcessing
) {
  const { currentVersionChangeTempFilePath, currentMajor, previousVersionLinkTitle, currentVersionChangeFilePath } =
    runtimeConfig;

  const { processedFileByMajor, blankLengthByMajor } = splitContext;
  const prevVersions = Object.keys(processedFileByMajor)
    .filter((v) => v !== currentMajor)
    .map((v) => parseInt(v, 10))
    .sort((a, b) => b - a);

  // 需要链接其他版本
  const count = prevVersions.length;
  if (count > 0) {
    // 通常是存在的，为了便于单元测试时不存在
    if (!fs.existsSync(currentVersionChangeTempFilePath)) {
      await fsp.mkdir(path.dirname(currentVersionChangeTempFilePath), { recursive: true });
    }

    if (!blankLengthByMajor[currentMajor]) {
      await fsp.appendFile(currentVersionChangeTempFilePath, `\n\n`);
    }

    await fsp.appendFile(currentVersionChangeTempFilePath, `${generatedSeparator}\n\n`);
    await fsp.appendFile(currentVersionChangeTempFilePath, `${previousVersionLinkTitle}\n`);

    const currentDir = path.dirname(currentVersionChangeFilePath);
    for (const v of prevVersions) {
      const index = prevVersions.indexOf(v);
      onProcessing?.({
        stage: SplitProcessingStage.Refer,
        progress: (index + 1) / count,
      });

      const filePath = processedFileByMajor[v];
      const relativePath = path.relative(currentDir, filePath);
      await fsp.appendFile(currentVersionChangeTempFilePath, `- [v${v}.x](${relativePath})\n`);
    }

    await fsp.appendFile(currentVersionChangeTempFilePath, '\n');
  }

  // 通常是存在的，为了便于单元测试时不存在
  if (fs.existsSync(currentVersionChangeTempFilePath)) {
    // 复制当前大版本的更新日志临时文件回原地
    await pipeFile(currentVersionChangeTempFilePath, currentVersionChangeFilePath);
    await fsp.rm(currentVersionChangeTempFilePath);
  }
}

/**
 * 切割更新日志
 * @param {StrictUserConfig} config
 * @param {StrictUserConfig} config
 * @param {OnProcessing} [onProcessing]
 * @returns {Promise<SplitResult>}
 */
export async function splitChangelog(config: StrictUserConfig, onProcessing?: OnProcessing): Promise<SplitResult> {
  const runtimeConfig = createRuntimeConfig(config);
  const splitContext = await parseCurrentChangelog(runtimeConfig, onProcessing);
  await referPreviousChangelog(runtimeConfig, splitContext, onProcessing);
  return { splitContext, runtimeConfig };
}
