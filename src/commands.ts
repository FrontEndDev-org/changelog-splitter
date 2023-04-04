import chalk from 'chalk';
import { SingleBar } from 'cli-progress';
import { tryFlatten } from 'try-flatten';
import { defineConfig, UserConfig } from './config';
import { Printer } from './printer.class';
import { splitChangelog, SplitProcessingStage, SplitResult } from './splitter';

export function printResult(splitResult: SplitResult) {
  const { splitContext, runtimeConfig } = splitResult;
  const { cwd, currentVersionChangeFilePath, currentChangelogFilePath, currentVersionChangeTempFilePath } =
    runtimeConfig;
  const { processedFileByMajor, deprecatedMajorFiles } = splitContext;
  const printer = new Printer(cwd);

  console.log(`更新日志文件变化情况如下（删除标记“${Printer.removeSymbol}”的文件需要手动删除）：`);

  // current version changelog
  if (currentChangelogFilePath === currentVersionChangeFilePath) {
    printer.updateFile(currentVersionChangeFilePath);
  } else {
    printer.removeFile(currentChangelogFilePath);
    printer.insertFile(currentVersionChangeFilePath);
  }

  // previous version changelog
  for (const [major, file] of Object.entries(processedFileByMajor)) {
    if (file === currentVersionChangeTempFilePath) continue;
    printer.insertFile(file);
  }
  for (const [major, file] of Object.entries(deprecatedMajorFiles)) {
    printer.removeFile(file);
  }
}

export async function run(userConfig: UserConfig) {
  const strictUserConfig = defineConfig(userConfig);
  const stageNames: Record<SplitProcessingStage, string> = {
    [SplitProcessingStage.Parse]: '解析',
    [SplitProcessingStage.Refer]: '引用',
  };
  const createBar = (stage: SplitProcessingStage) => {
    const bar = new SingleBar({
      format: `${stageNames[stage]} [{bar}] {percentage}%`,
    });
    bar.start(100, 0);
    return bar;
  };
  const bars: Record<SplitProcessingStage, SingleBar | null> = {
    [SplitProcessingStage.Parse]: null,
    [SplitProcessingStage.Refer]: null,
  };

  console.log('更新日志文件切割进行中...');
  console.log();

  const [err, res] = await tryFlatten(
    splitChangelog(strictUserConfig, (processing) => {
      const bar = (bars[processing.stage] = bars[processing.stage] || createBar(processing.stage));
      bar.update(processing.progress * 100);
      if (processing.progress === 1) bar.stop();
    })
  );

  console.log();

  if (err) {
    console.log(chalk.redBright('更新日志文件切割失败'));
    console.log(chalk.redBright(err.message));
    return;
  }

  printResult(res);
  console.log();
  console.log(chalk.greenBright('更新日志文件切割成功'));
}
