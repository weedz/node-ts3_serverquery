export enum ValidEvents {
     "error" = "error",
     "server" = "server",
     "channel" = "channel",
     "textserver" = "textserver",
     "textchannel" = "textchannel",
     "textprivate" = "textprivate",
}
export type EventHooks = {
    [ValidEvents.error]: "error"
    [ValidEvents.server]: "notifyclientleftview" | "notifycliententerview" | "notifyserveredited"
    [ValidEvents.channel]: "notifyclientmoved" | "notifyclientleftview" | "notifycliententerview" | "notifychanneledited" | "notifychanneldeleted"
    [ValidEvents.textserver]: "notifytextmessage"
    [ValidEvents.textchannel]: "notifytextmessage"
    [ValidEvents.textprivate]: "notifytextmessage"
}

export enum ValidHooks {
    "error" = "error",
    "notifyclientleftview" = "notifyclientleftview",
    "notifycliententerview" = "notifycliententerview",
    "notifyclientmoved" = "notifyclientmoved",
    "notifyserveredited" = "notifyserveredited",
    "notifychanneledited" = "notifychanneledited",
    "notifychanneldeleted" = "notifychanneldeleted",
    "notifytextmessage" = "notifytextmessage",
}

const valid_events: {
    [K in ValidEvents]: { [key in EventHooks[K]]: any}
} = {
    error: {
        error: true
    },
    server: {
        notifyclientleftview: true,
        notifycliententerview: true,
        notifyserveredited: true
    },
    channel: {
        notifyclientmoved: true,
        notifyclientleftview: true,
        notifycliententerview: true,
        notifychanneledited: true,
        notifychanneldeleted: true
    },
    textserver: {
        notifytextmessage: true
    },
    textchannel: {
        notifytextmessage: true
    },
    textprivate: {
        notifytextmessage: true
    }
};
export default valid_events;
