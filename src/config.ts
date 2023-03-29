import { RuntimeConfig, UserConfig } from './types';

export const defaults: RuntimeConfig = {
  cwd: process.cwd(),
  sourceFile: 'CHANGELOG.md',
  targetFile: 'changelogs/v[major].x.md',
  previousVersionFileTitle: '# v[major].x 更新日志',
  previousVersionLinkTitle: '## 其他版本的更新日志',
  processVersion: () => 0,
};

export function defineConfig(config?: UserConfig): RuntimeConfig {
  return Object.assign({}, defaults, config) as RuntimeConfig;
}
