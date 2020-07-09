import { ValidEvents } from "../Connection"

export enum ValidHooks {
    error,
    notifyclientleftview,
    notifycliententerview,
    notifyserveredited,
    notifyclientmoved,
    notifychanneledited,
    notifychanneldeleted,
    notifytextmessage,
};

const valid_events: {[event in keyof ValidEvents]: any} = {
    error: {
        [ValidHooks.error]: true
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
