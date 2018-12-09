import chalk from "chalk";
import * as config from "../config.json";

const logLevelMap = {
    0: chalk.red.bold.underline,
    1: chalk.red,
    2: chalk.yellow,
    3: chalk.cyan,
    other: chalk.magenta
};

/**
 * @param {number} level - Log level, 0=critical,1=error, 2=warn, 3=info, 4=debug 5=ALL debug
 */
export default function Log(str: string, identifier: string, level: number = 3) {
    if (config.logLevel < level) {
        return;
    }
    if (logLevelMap[level]) {
        process.stdout.write(logLevelMap[level](new Date().toISOString()));
    } else {
        process.stdout.write(logLevelMap.other(new Date().toISOString()));
    }
    if (identifier) {
        process.stdout.write(`: [${chalk.green(identifier)}]`);
    }
    process.stdout.write(`: ${str}\n`);
}
