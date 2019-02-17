/// <reference path="Types/Types.d.ts" />
import chalk, { Chalk } from "chalk";
import * as config from "../config.json";

const logLevelMap: {[loglevel:number]: Chalk} = {
    0: chalk.red.bold.underline,
    1: chalk.red,
    2: chalk.yellow,
    3: chalk.cyan,
    4: chalk.magenta,
    5: chalk.magenta
};
const logLevelString: {[loglevel:number]: string} = {
    0: "CRITICAL",
    1: "ERROR",
    2: "WARN",
    3: "INFO",
    4: "DEBUG",
    5: "ALL_DEBUG"
};

/**
 * @param str Message
 * @param identifier Log identifier
 * @param level Log level, 0=critical,1=error, 2=warn, 3=info, 4=debug 5=ALL debug
 */
export default function Log(str: string, identifier: string, level: LogLevels = 3) {
    if (config.logLevel < level) {
        return;
    }
    if (!identifier) {
        identifier = "LOG";
    }

    let logMsg = `${chalk.white(new Date().toISOString())} [${logLevelMap[level](logLevelString[level])}]`;
    logMsg += `: [${chalk.green(identifier)}]`;
    logMsg += `: ${str}\n`;
    process.stdout.write(logMsg);
}
