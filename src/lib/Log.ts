import { bold, cyan, green, magenta, red, underline, white, yellow, type Color } from "colorette";

import config from "../config.json" assert { type: "json" };

export enum LogLevels {
    CRITICAL = 0,
    ERROR,
    WARN,
    INFO,
    DEBUG,
    DEBUG_ALL
}

const logLevelMap: {[loglevel in LogLevels]: Color} = {
    0: str => bold(red(underline(str))),
    1: red,
    2: yellow,
    3: cyan,
    4: magenta,
    5: magenta
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

    let logMsg = `${white(new Date().toISOString())} [${logLevelMap[level](logLevelString[level])}]`;
    logMsg += `: [${green(identifier)}]`;
    logMsg += `: ${str}\n`;
    process.stdout.write(logMsg);
}
