/// <reference path="Types/TeamSpeak.d.ts" />

export interface TSCommandParam {
    [key:string]: string|number
}

export type TSCommandParamDefinion = TSCommandParam | string[] | number[];

export interface TSCommandDefinition {
    description?: string;
    params?: TSCommandParamDefinion
    callback?: Function
}

export interface TSCommandList {
    clientinfo: {
        clid: number
    },
    help: string|undefined,
    login: {
        client_login_name: string,
        client_login_password: string
    },
    use: number
    clientupdate: {
        client_nickname: string
    },
    whoami: null,
    version: null,
    servernotifyregister: {
        event: string
    }
}
