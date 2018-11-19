/**
 * @param args Do not send a string, use a JSON structure
 */
export function parseArgsToString(cmd, args) {
    let str = cmd;
    if (typeof args === 'object') {
        str += " " + parseArgsFromObject(args);
    }
    return str;
}

function parseArgsFromArray(args) {
    return args.join(" ");
}

function parseArgsFromJSON(args) {
    let str = "";
    for (let key of Object.keys(args)) {
        str += ` ${key}=${escapeToTS(args[key])}`;
    }
    return str;
}

function parseArgsFromObject(args) {
    return Array.isArray(args) ?
        parseArgsFromArray(args) :
        parseArgsFromJSON(args);
}

export function parseParams(msg, type, start = 0) {
    let params = false;
    if (type === 2) {
        params = parseParamsList(msg);
    } else if (type !== 0) {
        params = parseParamsElement(msg, start);
    }
    return params;
}

function parseParamsList(msg) {
    return msg.split("|").map(item => parseParams(item, 1));
}

function parseParamsElement(msg, start) {
    const params = {};
    for (let param of msg.substr(start).trim().split(" ")) {
        const divider = param.indexOf("=");
        const key = param.substr(0, divider);
        const value = escapeFromTS(param.substr(divider + 1));
        params[key] = value;
    }
    return params;
}

export function escapeToTS(value) {
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
            .replace(/\v/g, "\\v")
    }
    return value;
}

export function escapeFromTS(value) {
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
