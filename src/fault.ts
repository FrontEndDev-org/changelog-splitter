import { defineFault } from './fault-js';

const configFaultDefinition = {
  CHANGELOG_NOT_FOUND: '更新日志文件不存在',
  PACKAGE_JSON_READ_ERROR: 'package.json 文件读取失败',
  PACKAGE_JSON_PARSE_ERROR: 'package.json 文件解析失败',
};
export const ConfigFault = defineFault('ConfigFault', configFaultDefinition);
export type ConfigFaultInstance = InstanceType<typeof ConfigFault>;
export type ConfigFaultCode = keyof typeof configFaultDefinition;

const splitFaultDefinition = {
  LINK_CHANGELOG_NOT_FOUND: '链接的更新日志文件不存在',
};
export const SplitFault = defineFault('SplitFault', splitFaultDefinition);
export type SplitFaultInstance = InstanceType<typeof SplitFault>;
export type SplitFaultCode = keyof typeof splitFaultDefinition;
