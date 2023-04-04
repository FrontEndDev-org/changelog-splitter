import chalk from 'chalk';
import path from 'path';

export class Printer {
  counts = {
    insertFiles: new Set<string>(),
    updateFiles: new Set<string>(),
    removeFiles: new Set<string>(),
  };

  static insertSymbol = chalk.cyanBright('+');
  static updateSymbol = chalk.yellowBright('~');
  static removeSymbol = chalk.redBright('-');

  constructor(private readonly cwd: string) {}

  private toRelative(to: string) {
    return path.relative(this.cwd, to);
  }

  insertFile(file: string) {
    if (this.counts.insertFiles.has(file)) return;

    console.log(Printer.insertSymbol, this.toRelative(file));
    this.counts.insertFiles.add(file);
  }

  updateFile(file: string) {
    if (this.counts.updateFiles.has(file)) return;

    console.log(Printer.updateSymbol, this.toRelative(file));
    this.counts.updateFiles.add(file);
  }

  removeFile(file: string) {
    if (this.counts.removeFiles.has(file)) return;

    console.log(Printer.removeSymbol, this.toRelative(file));
    this.counts.removeFiles.add(file);
  }
}
