import chalk from 'chalk';
import config from '../config.json';
/**
 * @param {integer} level - Log level, 0=critical,1=error, 2=warn, 3=info, 4=debug 5=ALL debug
 */
export default function Log(str, identifier, level = 3) {
    if (config.logLevel < level) {
        return;
    }
    if (level === 0) {
        process.stdout.write(chalk.red.bold.underline(new Date().toISOString()));
    } else if (level === 1) {
        process.stdout.write(chalk.red(new Date().toISOString()));
    } else if (level === 2) {
        process.stdout.write(chalk.yellow(new Date().toISOString()));
    } else if (level === 3) {
        process.stdout.write(chalk.cyan(new Date().toISOString()));
    } else {
        process.stdout.write(chalk.magenta(new Date().toISOString()));
    }
    if (identifier) {
        process.stdout.write(`: [${chalk.green(identifier)}]`);
    }
    process.stdout.write(`: ${str}\n`);
}
