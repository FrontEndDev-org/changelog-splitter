import fs from 'fs';
import path from 'path';
import { tryFlatten } from 'try-flatten';
import { ConfigFault } from './fault';
import type { SplitInfo } from './splitter';
import { createTempDirname, matchMajor } from './utils';

export enum ConflictStrategy {
  // 选择当前正在处理的文件
  ProcessingFile,

  // 选择已经处理过的文件
  ProcessedFile,
}

export interface UserConfig {
  /**
   * 工作目录
   * @default process.cwd()
   */
  cwd?: string;

  /**
   * 当前更新日志文件
   * @default "CHANGELOG.md"
   */
  currentChangelogFile?: string;

  /**
   * 当前版本的更新日志文件，默认与 currentChangelogFile 相同
   */
  currentVersionChangeFileName?: string;

  /**
   * package.json 文件路径，从里面读取当前版本号
   * @default "package.json"
   */
  packageFile?: string;

  /**
   * 其他版本更新日志的文件名，可以使用 `[major]` 表示大版本号
   * @default "changelogs/v[major].x-CHANGELOG.md"
   */
  previousVersionChangelogFileName?: string;

  /**
   * 其他版本更新日志文件冲突处理策略，默认选择当前配置的文件
   */
  previousVersionChangelogConflictStrategy?: ConflictStrategy;

  /**
   * 其他版本更新日志的标题，可以使用 `[major]` 表示大版本号
   * @default "# v[major].x 更新日志"
   */
  previousVersionChangelogTitle?: string;

  /**
   * 其他版本引用标题
   * @default "## 其他版本的更新日志"
   */
  previousVersionLinkTitle?: string;

  /**
   * 版本处理回调
   * @param {string} line
   * @param {number} progress
   * @returns {any}
   */
  onProcessing?: (process: SplitInfo) => any;
}

export type StrictUserConfig = Required<UserConfig>;

export interface ExtendConfig {
  /**
   * 根据 cwd 解析路径
   * @param {string} segments
   * @returns {string}
   */
  resolvePath: (...segments: string[]) => string;

  /**
   * 当前更新日志的文件路径
   */
  currentChangelogFilePath: string;

  /**
   * 当前版本的更新日志的文件路径
   */
  currentVersionChangeFilePath: string;

  /**
   * 当前版本的更新日志的临时文件路径，用于临时收集各大版本的更新日志
   * 收集完成后会将内容转移到 currentVersionChangeFilePath
   */
  currentVersionChangeTempFilePath: string;

  /**
   * 当前版本号
   */
  currentVersion: string;

  /**
   * 当前主版本号
   */
  currentMajor: string;
}

export type RuntimeConfig = StrictUserConfig & ExtendConfig;

export const defaults: StrictUserConfig = {
  cwd: process.cwd(),
  currentChangelogFile: 'CHANGELOG.md',
  currentVersionChangeFileName: 'CHANGELOG.md',
  packageFile: 'package.json',
  previousVersionChangelogFileName: 'changelogs/v[major].x-CHANGELOG.md',
  previousVersionChangelogConflictStrategy: ConflictStrategy.ProcessingFile,
  previousVersionChangelogTitle: '# v[major].x 更新日志',
  previousVersionLinkTitle: '## 其他版本的更新日志',
  onProcessing: () => 0,
};

/**
 * 定义配置
 * @param {UserConfig} config
 * @returns {StrictUserConfig}
 */
export function defineConfig(config?: UserConfig): StrictUserConfig {
  return Object.assign({}, defaults, config) as StrictUserConfig;
}

/**
 * 创建运行期配置
 * @param {StrictUserConfig} strictUserConfig
 * @returns {RuntimeConfig}
 */
export function createRuntimeConfig(strictUserConfig: StrictUserConfig): RuntimeConfig {
  const { cwd, packageFile, currentChangelogFile, currentVersionChangeFileName } = strictUserConfig;
  const resolvePath = (...segments: string[]): string => path.resolve(cwd, ...segments);
  const currentChangelogFilePath = resolvePath(currentChangelogFile);
  const currentVersionChangeFilePath = resolvePath(currentVersionChangeFileName);
  const currentMajorChangelogFilePath = path.join(createTempDirname(), `CHANGELOG.md`);

  if (!fs.existsSync(currentChangelogFilePath))
    throw new ConfigFault('CHANGELOG_NOT_FOUND', `${currentChangelogFile} 文件不存在`);

  const packageFilePath = resolvePath(packageFile);
  let currentVersion = '';
  let currentMajor = '';

  if (fs.existsSync(packageFilePath)) {
    const [jsonError, json] = tryFlatten(() => fs.readFileSync(packageFilePath, 'utf8'));
    if (jsonError) throw new ConfigFault('PACKAGE_JSON_READ_ERROR').because(jsonError);

    const [parseError, parseResult] = tryFlatten(() => JSON.parse(json) as { version: string });
    if (parseError) throw new ConfigFault('PACKAGE_JSON_PARSE_ERROR').because(parseError);

    const { version } = parseResult;
    currentVersion = version;
    currentMajor = matchMajor(version);
  }

  return Object.assign<any, any, ExtendConfig>({}, strictUserConfig, {
    resolvePath,
    currentChangelogFilePath,
    currentVersionChangeFilePath,
    currentVersion,
    currentMajor,
    currentVersionChangeTempFilePath: currentMajorChangelogFilePath,
  });
}
