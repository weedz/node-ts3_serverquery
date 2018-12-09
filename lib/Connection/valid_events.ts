const VALID_EVENTS = {
    "error": {
        "error": 1
    },
    "server": {
        "notifyclientleftview": 1,
        "notifycliententerview": 1,
        "notifyserveredited": 1
    },
    "channel": {
        "notifyclientmoved": 1,
        "notifyclientleftview": 1,
        "notifycliententerview": 1,
        "notifychanneledited": 1,
        "notifychanneldeleted": 1
    },
    "textserver": {
        "notifytextmessage": 1
    },
    "textchannel": {
        "notifytextmessage": 1
    },
    "textprivate": {
        "notifytextmessage": 1
    }
}
export default VALID_EVENTS;
