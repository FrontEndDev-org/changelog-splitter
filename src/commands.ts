import chalk from 'chalk';
import process from 'process';
import { defineConfig } from './config';
import { split } from './splitter';

export function run() {
  const config = defineConfig();
  split(config)
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.log(chalk.redBright(error.message));
      process.exit(1);
    });
}
