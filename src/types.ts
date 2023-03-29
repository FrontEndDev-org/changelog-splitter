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
  sourceFile?: string;

  /**
   * 目标文件，可以使用 `[major]` 表示大版本号
   * @default "changelogs/v[major].x.md"
   */
  targetFile?: string;

  /**
   * 其他版本文件标题，可以使用 `[major]` 表示大版本号
   * @default "# v[major].x 更新日志"
   */
  previousVersionFileTitle?: string;

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

export type RuntimeConfig = Required<UserConfig>;
