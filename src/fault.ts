import { defineFault } from './fault-js';

const ConfigFaultDefinition = {
  CHANGELOG_NOT_FOUND: 'CHANGELOG 文件不存在',
  PACKAGE_JSON_READ_ERROR: 'package.json 文件读取失败',
  PACKAGE_JSON_PARSE_ERROR: 'package.json 文件解析失败',
};
export const ConfigFault = defineFault('ConfigFault', ConfigFaultDefinition);
export type ConfigFaultInstance = InstanceType<typeof ConfigFault>;
export type ConfigFaultCode = keyof typeof ConfigFaultDefinition;
