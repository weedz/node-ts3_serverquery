export function parseArgsToString(cmd, args) {
    let str = cmd;
    if (typeof args === 'object') {
        str += ' ' + parseArgsFromObject(args);
    } else if (typeof args === 'string') {
        str += ' ' + args;
    }
    return str;
}
function parseArgsFromObject(args) {
    return Array.isArray(args)
        ? args.join(" ")
        : Object.entries(args).map(([key, value]) => `${key}=${value}`).join(" ");
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
    const paramArray = msg.substr(start).trim()
        .split(" ")
        .map(param => param.split("="));
    for (let param of paramArray) {
        params[param[0]] = param[1];
    }
    return params;
}
