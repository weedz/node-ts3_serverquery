import kleur from "kleur";
import config from "../config.json";

export enum LogLevels {
    CRITICAL = 0,
    ERROR,
    WARN,
    INFO,
    DEBUG,
    DEBUG_ALL
}

const logLevelMap: {[loglevel:number]: kleur.Color} = {
    0: kleur.bold().red().underline,
    1: kleur.red,
    2: kleur.yellow,
    3: kleur.cyan,
    4: kleur.magenta,
    5: kleur.magenta
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

    let logMsg = `${kleur.white(new Date().toISOString())} [${logLevelMap[level](logLevelString[level])}]`;
    logMsg += `: [${kleur.green(identifier)}]`;
    logMsg += `: ${str}\n`;
    process.stdout.write(logMsg);
}
