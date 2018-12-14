declare enum LogLevels {
    CRITICAL = 0,
    ERROR,
    WARN,
    INFO,
    DEBUG,
    DEBUG_ALL
}
declare type SendParamArgs = {
    [key:string] : string|number
}|string[]|number[];

declare type AllowedPluginEvents = 
    |"init"
    |"connected"
    |"disconnected"
    |"reload"
    |"unload";

declare interface TS_ErrorState {
    id: string|number,
    msg: string
}

declare type TS_Events = 
    |"error"
    |"server"
    |"channel"
    |"textserver"
    |"textchannel"
    |"textprivate";

declare type TS_ValidEventHooks = 
    |"error"
    |"notifyclientleftview"
    |"notifycliententerview"
    |"notifyclientmoved";

declare interface TS_EventHooks {
    "error"?:Function;
    "notifyclientleftview"?:Function;
    "notifycliententerview"?:Function;
    "notifyclientmoved"?:Function;
}
