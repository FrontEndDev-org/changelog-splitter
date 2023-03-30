import fs from 'fs';
import path from 'path';
import { ExtendConfig, RuntimeConfig, StrictUserConfig, UserConfig } from './types';
import { createTempDirname, matchMajor } from './utils';

export const defaults: StrictUserConfig = {
  cwd: process.cwd(),
  currentChangelogFile: 'CHANGELOG.md',
  packageFile: 'package.json',
  previousVersionChangelogFileName: 'changelogs/v[major].x.md',
  previousVersionChangelogTitle: '# v[major].x 更新日志',
  previousVersionLinkTitle: '## 其他版本的更新日志',
  processVersion: () => 0,
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
  const { cwd, packageFile, currentChangelogFile } = strictUserConfig;
  const resolvePath = (...segments: string[]): string => path.resolve(cwd, ...segments);
  const currentChangelogFilePath = resolvePath(currentChangelogFile);
  const currentMajorChangelogFilePath = path.join(createTempDirname(), `CHANGELOG.md`);

  const packageFilePath = resolvePath(packageFile);
  const json = fs.readFileSync(packageFilePath, 'utf8');
  const { version: currentVersion } = JSON.parse(json) as { version: string };
  const currentMajor = matchMajor(currentVersion);

  return Object.assign<any, any, ExtendConfig>({}, strictUserConfig, {
    resolvePath,
    currentChangelogFilePath,
    currentVersion,
    currentMajor,
    currentMajorChangelogFilePath,
  });
}
