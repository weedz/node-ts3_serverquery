import { TSCommandList } from "../commands";

export function parseArgsToString<K extends keyof TSCommandList>(cmd: K, args: TSCommandList[K]) {
    let str = cmd as string;
    if (typeof args === "object") {
        str += " " + parseArgsFromObject(args);
    } else {
        str += " " + args as string;
    }
    return str;
}

function parseArgsFromArray(args: string[] | number[]) {
    return args.join(" ");
}

function parseArgsFromJSON(args: any) {
    return Object.keys(args).reduce( (accumulator, key) => {
        const value = args[key];
        if (key.substr(0,1) === "-") {
            // Handle "flag" type arguments. eg. "-all"
            if (value) {
                accumulator += ` ${key}`;
            }
        } else {
            if (Array.isArray(value)) {
                accumulator += value.map( currentValue => parseArgsFromJSON(currentValue)).join('|');
            } else if (typeof value === "boolean") {
                accumulator += ` ${key}=${value ? "1" : "0"}`;
            } else {
                accumulator += ` ${key}=${escapeToTS(value)}`;
            }
        }
        return accumulator;
    }, "");
}

function parseArgsFromObject<K extends keyof TSCommandList>(args: TSCommandList[K]) {
    return Array.isArray(args)
        ? parseArgsFromArray(args)
        : parseArgsFromJSON(args);
}

export function parseParams(msg: string, type: number, start = 0): object | boolean {
    let params: object | boolean = false;
    if (type === 2) {
        params = parseParamsList(msg);
    } else if (type !== 0) {
        params = parseParamsElement(msg, start);
    }
    return params;
}

function parseParamsList(msg: string) {
    return msg.split("|").map(item => parseParams(item, 1));
}

function parseParamsElement(msg: string, start: number) {
    const params: { [K:string]: string|number } = {};
    for (let param of msg.substr(start).trim().split(" ")) {
        const divider = param.indexOf("=");
        if (divider === -1) {
            params[param] = '';
        } else {
            const key = param.substr(0, divider);
            const value = escapeFromTS(param.substr(divider + 1));
            params[key] = value;
        }
    }
    return params;
}

export function escapeToTS(value: string | number) {
    if (typeof value === "string") {
        return value
            .replace(/\\/g, "\\\\")
            .replace(/\//g, "\\/")
            .replace(/ /g, "\\s")
            .replace(/\|/g, "\\p")
            .replace(/\u0007/g, "\\a")
            .replace(/\u0008/g, "\\b")
            .replace(/\f/g, "\\f")
            .replace(/\n/g, "\\n")
            .replace(/\r/g, "\\r")
            .replace(/\t/g, "\\t")
            .replace(/\v/g, "\\v");
    }
    return value;
}

export function escapeFromTS(value: string | number) {
    if (typeof value === "string") {
        return value
            .replace(/\\\//g, "/")
            .replace(/\\s/g, " ")
            .replace(/\\p/g, "|")
            .replace(/\\a/g, "\u0007")
            .replace(/\\b/g, "\u0008")
            .replace(/\\f/g, "\f")
            .replace(/\\n/g, "\n")
            .replace(/\\r/g, "\r")
            .replace(/\\t/g, "\t")
            .replace(/\\v/g, "\v")
            .replace(/\\\\/g, "\\");
    }
    return value;
}
