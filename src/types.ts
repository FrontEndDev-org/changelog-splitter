export interface UserConfig {
  /**
   * 工作目录
   * @default process.cwd()
   */
  cwd?: string;

  /**
   * 原始文件
   * @default "CHANGELOG.md"
   */
  currentChangelogFile?: string;

  /**
   * package.json 文件路径，从里面读取当前版本号
   * @default "package.json"
   */
  packageFile?: string;

  /**
   * 其他版本更新日志的文件名，可以使用 `[major]` 表示大版本号
   * @default "changelogs/v[major].x.md"
   */
  previousVersionChangelogFileName?: string;

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
   * 版本处理钩子
   * @param {string} version
   * @param {string} major
   * @returns {any}
   */
  processVersion?: (version: string, major: string) => any;
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
   * 当前更新日志文件路径
   */
  currentChangelogFilePath: string;

  /**
   * 当前版本号
   */
  currentVersion: string;

  /**
   * 当前主版本号
   */
  currentMajor: string;

  /**
   * 当前主版本号的更新文件路径，临时文件
   */
  currentMajorChangelogFilePath: string;
}

export type RuntimeConfig = StrictUserConfig & ExtendConfig;

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
