const valid_events: {
    [event:string]: {
        [id:string]: boolean
    }
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
