import { ValidEvents } from "./Connection/valid_events.js";
import type { TS_InstanceProperties, TS_BindingSubsystem, TS_Flag, TS_VirtualServerProperties, TS_PermissionGroupDatabaseTypes, TS_ChannelProperties, TS_ClientProperties, TS_whoami } from "./Types/TeamSpeak.js";

interface PermissionParam {
    permvalue: number|string,
    permnegated?: boolean|number,
    permskip?: boolean|number,
}

export interface TSCommandList {
    help: string|null,
    quit: null,
    login: {
        client_login_name: string,
        client_login_password: string
    },
    logout: null,
    version: null,
    hostinfo: null,
    instanceinfo: null,
    instanceedit: Partial<TS_InstanceProperties>,
    use: number,
    bindinglist: {
        subsystem?: TS_BindingSubsystem
    }
    serverlist: {
        "-uid"?: TS_Flag,
        "-short"?: TS_Flag,
        "-all"?: TS_Flag,
        "-onlyoffline"?: TS_Flag,
    },
    serveridgetbyport: {
        virtualserver_port: number
    },
    serverdelete: {
        sid: number
    },
    servercreate: {
        virtualserver_name: string
    } & Partial<TS_VirtualServerProperties>,
    serverstart: {
        sid: number
    },
    serverstop: {
        sid: number
    },
    serverprocessstop: null,
    serverinfo: null,
    serverrequestconnectioninfo: null,
    servertemppasswordadd: {
        pw: string,
        desc: string,
        duration: number,
        tcid: number,
        tcpw: string
    },
    servertemppassworddel: {
        pw: string
    },
    servertemppasswordlist: null,
    serveredit: Partial<TS_VirtualServerProperties>,
    servergrouplist: null,
    servergroupadd: {
        name: string,
        type?: TS_PermissionGroupDatabaseTypes
    },
    servergroupdel: {
        sgid: number,
        force: TS_Flag
    }
    servergroupcopy: {
        ssgid: number,
        tsgid: number,
        name: string,
        type: TS_PermissionGroupDatabaseTypes
    },
    servergrouprename: {
        sgid: number,
        name: string
    },
    servergrouppermlist: {
        sgid: number,
        "-permsid"?: TS_Flag
    },
    servergroupaddperm: {
        sgid: number,
        permissions: [
            PermissionParam & {
                permid: number
            } | 
            PermissionParam & {
                permsid: string
            }
        ]
    },
    servergroupdelperm: {
        sgid: number,
        permissions: [
            {
                permid: number
            } |
            {
                permsid: string
            }
        ]
    },
    servergroupaddclient: {
        sgid: number,
        cldbid: number
    },
    servergroupdelclient: {
        sgid: number,
        cldbid: number
    },
    servergroupclientlist: {
        sgid: number,
        "-names"?: TS_Flag
    },
    servergroupsbyclientid: {
        cldbid: number
    },
    servergroupautoaddperm: {
        sgtype: number,
        permissions: [
            PermissionParam & {
                permid: number
            } | 
            PermissionParam & {
                permsid: string
            }
        ]
    },
    servergroupautodelperm: {
        sgtype: number,
        permissions: [
            {
                permid: number
            } |
            {
                permsid: string
            }
        ]
    }
    serversnapshotcreate: null,
    serversnapshotdeploy: any,
    servernotifyregister: {
        event: ValidEvents,
        id?: number
    },
    servernotifyunregister: null,
    sendtextmessage: {
        targetmode: 1|2|3,
        target: number,
        msg: string
    },
    logview: {
        lines?: number,
        reverse?: TS_Flag,
        instance?: 0|1,
        begin_pos?: number
    },
    logadd: {
        loglevel: 1|2|3|4,
        logmsg: string
    },
    gm: {
        msg: string
    },
    channellist: {
        "-topic"?: TS_Flag,
        "-flags"?: TS_Flag,
        "-voice"?: TS_Flag,
        "-limits"?: TS_Flag,
        "-icon"?: TS_Flag,
        "-secondsempty"?: TS_Flag
    },
    channelinfo: {
        cid: number
    },
    channelfind: {
        pattern: string
    },
    channelmove: {
        cid: number,
        cpid: number,
        order?: number
    },
    channelcreate: {
        channel_name: string
    } & Partial<TS_ChannelProperties>,
    channeldelete: {
        cid: number,
        force?: TS_Flag
    },
    channeledit: {
        cid: number,
    } & Partial<TS_ChannelProperties>,
    channelgrouplist: null,
    channelgroupadd: {
        name: string,
        type?: TS_PermissionGroupDatabaseTypes
    },
    channelgroupdel: {
        cgid: number,
        force?: TS_Flag
    },
    channelgroupcopy: {
        scgid: number,
        tsgid: number,
        name: string,
        type: TS_PermissionGroupDatabaseTypes
    },
    channelgrouprename: {
        cgid: number,
        name: string
    },
    channelgroupaddperm: {
        cgid: number,
        permissions: [
            PermissionParam & {
                permid: number
            } | 
            PermissionParam & {
                permsid: string
            }
        ]
    },
    channelgrouppermlist: {
        cgid: number,
        "-permsid"?: TS_Flag
    },
    channelgroupdelperm: {
        cgid: number,
        permissions: [
            {
                permid: number
            } | {
                permsid: string
            }
        ]
    }
    channelgroupclientlist: {
        cid?: number,
        cldbid?: number,
        cgid?: number
    },
    setclientchannelgroup: {
        cgid: number,
        cid: number,
        cldbid: number
    },
    tokenadd: {
        tokentype: 0|1,
        tokenid1: number,
        tokenid2: number,
        tokendescription?: string,
        tokencustomset?: any // customFieldSet
    },
    tokendelete: {
        token: string
    },
    tokenlist: null,
    tokenuse: {
        token: string
    },
    channelpermlist: {
        cid: number,
        "-permsid"?: TS_Flag
    },
    channeladdperm: {
        cid: number,
        permissions: [
            PermissionParam & {
                permid: number
            } | 
            PermissionParam & {
                permsid: string
            }
        ]
    },
    channeldelperm: {
        cid: number,
        permissions: [
            {
                permid: number
            } | {
                permsid: string
            }
        ]
    }
    clientlist: {
        "-uid"?: TS_Flag,
        "-away"?: TS_Flag,
        "-voice"?: TS_Flag,
        "-times"?: TS_Flag,
        "-groups"?: TS_Flag,
        "-info"?: TS_Flag,
        "-country"?: TS_Flag,
        "-ip"?: TS_Flag,
        "-badges"?: TS_Flag
    },
    clientinfo: {
        clid: number
    },
    clientfind: {
        pattern: string
    },
    clientedit: {
        clid: number
    } & Partial<TS_ClientProperties>,
    clientdblist: {
        start?:number,
        duration?: number,
        "-count"?: TS_Flag
    },
    clientdbinfo: {
        cldbid: number
    },
    clientdbfind: {
        pattern: string,
        "-uid"?: TS_Flag
    },
    clientdbedit: {
        cldbid: number
    } & Partial<TS_ClientProperties>,
    clientdbdelete: {
        cldbid: number
    },
    clientgetids: {
        cluid: string
    },
    clientgetdbidfromuid: {
        cluid: string
    },
    clientgetnamefromuid: {
        cluid: string
    },
    clientgetuidfromclid: {
        clid: number
    },
    clientgetnamefromdbid: {
        cldbid: number
    },
    clientsetserverquerylogin: {
        client_login_name: string
    },
    clientupdate: Partial<TS_ClientProperties>,
    clientmove: {
        clients: [
            {
                clid: number
            }
        ],
        cid: number,
        cpw?: string
    },
    clientkick: {
        clients: [
            {
                clid: number
            }
        ],
        reasonid: 4|5,
        reasonmsg?: string
    },
    clientpoke: {
        clid: number, 
        msg: string
    },
    clientpermlist: {
        cldbid: number,
        "-permsid"?: TS_Flag
    },
    clientaddperm: {
        cldbid: number,
        permissions: [
            PermissionParam & {
                permid: number
            } | 
            PermissionParam & {
                permsid: string
            }
        ]
    },
    clientdelperm: {
        cldbid: number,
        permissions: [
            {
                permid: number
            } | {
                permsid: string
            }
        ]
    },
    channelclientpermlist: {
        cid: number,
        cldbid: number,
        "-permsid"?: TS_Flag
    },
    channelclientaddperm: {
        cid: number,
        cldbid: number,
        permissions: [
            PermissionParam & {
                permid: number
            } | 
            PermissionParam & {
                permsid: string
            }
        ]
    },
    channelclientdelperm: {
        cid: number,
        cldbid: number,
        permissions: [
            {
                permid: number
            } | {
                permsid: string
            }
        ]
    }
    permissionlist: null,
    permidgetbyname: {
        permissions: [
            {
                permsid: string
            }
        ]
    }
    permoverview: {
        cid: number,
        cldbid: number,
        permissions: [
            {
                permid: number
            } | {
                permsid: string
            }
        ]
    },
    permget: {
        permissions: [
            {
                permid: number
            } | {
                permsid: string
            }
        ]
    },
    permfind: {
        permissions: [
            {
                permid: number
            } | {
                permsid: string
            }
        ]
    },
    permreset: null,
    privilegekeylist: null,
    privilegekeyadd: {
        tokentype: 0|1,
        tokenid1: number,
        tokenid2: number,
        tokendescription?: string,
        tokencustomset?: any // customFieldSet
    },
    privilegekeydelete: {
        token: string
    },
    privilegekeyuse: {
        token: string
    },
    messagelist: null,
    messageadd: {
        cluid: string,
        subject: string,
        message: string
    },
    messagedel: {
        msgid: number
    },
    messageget: {
        msgid: number
    },
    messageupdateflag: {
        msgid: number,
        flag: TS_Flag
    },
    complainlist: {
        tcldbid?: number
    },
    complainadd: {
        tcldbid: number,
        message: string
    },
    complaindelall: {
        tcldbid: number
    },
    complaindel: {
        tcldbid: number,
        fcldbid: number
    },
    banclient: {
        clid: number,
        time: number,
        banreason?: string
    },
    banlist: null,
    banadd: (
        {
            ip: string
        } | {
            name: string,
        } | {
            uid: string
        }
    ) &
    {
        time?: number,
        banreason?: string
    },
    bandel: {
        banid: number
    },
    bandelall: null,
    ftinitupload: {
        clientftfid: string,
        name: string, 
        cid: number,
        cpw: string,
        size: number,
        overwrite: TS_Flag,
        resume: TS_Flag,
        proto?: number
    },
    ftinitdownload: {
        clientftfid: string|number,
        name: string, 
        cid: number,
        cpw: string,
        seekpos: number,
        proto?: number
    }
    ftlist: null,
    ftgetfilelist: {
        cid: number,
        cpw: string,
        path: string
    },
    ftgetfileinfo: {
        files: [
            {
                cid: number,
                cpw: string
            } & (
                {
                    name: string
                } | {
                    path: string
                }
            )
        ]
    },
    ftstop: {
        serverftfid: string|number,
        delete: TS_Flag
    },
    ftdeletefile: {
        files: [
            {
                cid: number,
                cpw: string
            } & (
                {
                    name: string
                } | {
                    path: string
                }
            )
        ]
    },
    ftcreatedir: {
        cid: number,
        cpw: string,
        dirname: string
    },
    ftrenamefile: {
        cid: number,
        cpw: string,
        tcid?: number,
        tcpwd?: string,
        oldname: string,
        newname: string
    },
    customsearch: {
        ident: string,
        pattern: string
    },
    custominfo: {
        cldbid: number
    },
    whoami: null
}

export interface TSReturnValue {
    help: any
    quit: any
    login: any
    logout: any
    version: any
    hostinfo: any
    instanceinfo: any
    instanceedit: any
    use: any
    bindinglist: any
    serverlist: any
    serveridgetbyport: any
    serverdelete: any
    servercreate: any
    serverstart: any
    serverstop: any
    serverprocessstop: any
    serverinfo: any
    serverrequestconnectioninfo: any
    servertemppasswordadd: any
    servertemppassworddel: any
    servertemppasswordlist: any
    serveredit: any
    servergrouplist: any
    servergroupadd: any
    servergroupdel: any
    servergroupcopy: any
    servergrouprename: any
    servergrouppermlist: any
    servergroupaddperm: any
    servergroupdelperm: any
    servergroupaddclient: any
    servergroupdelclient: any
    servergroupclientlist: any
    servergroupsbyclientid: any
    servergroupautoaddperm: any
    servergroupautodelperm: any
    serversnapshotcreate: any
    serversnapshotdeploy: any
    servernotifyregister: any
    servernotifyunregister: any
    sendtextmessage: any
    logview: any
    logadd: any
    gm: any
    channellist: any
    channelinfo: any
    channelfind: any
    channelmove: any
    channelcreate: any
    channeldelete: any
    channeledit: any
    channelgrouplist: any
    channelgroupadd: any
    channelgroupdel: any
    channelgroupcopy: any
    channelgrouprename: any
    channelgroupaddperm: any
    channelgrouppermlist: any
    channelgroupdelperm: any
    channelgroupclientlist: any
    setclientchannelgroup: any
    tokenadd: any
    tokendelete: any
    tokenlist: any
    tokenuse: any
    channelpermlist: any
    channeladdperm: any
    channeldelperm: any
    clientlist: any
    clientinfo: any
    clientfind: any
    clientedit: any
    clientdblist: any
    clientdbinfo: any
    clientdbfind: any
    clientdbedit: any
    clientdbdelete: any
    clientgetids: any
    clientgetdbidfromuid: any
    clientgetnamefromuid: any
    clientgetuidfromclid: any
    clientgetnamefromdbid: any
    clientsetserverquerylogin: any
    clientupdate: any
    clientmove: any
    clientkick: any
    clientpoke: any
    clientpermlist: any
    clientaddperm: any
    clientdelperm: any
    channelclientpermlist: any
    channelclientaddperm: any
    channelclientdelperm: any
    permissionlist: any
    permidgetbyname: any
    permoverview: any
    permget: any
    permfind: any
    permreset: any
    privilegekeylist: any
    privilegekeyadd: any
    privilegekeydelete: any
    privilegekeyuse: any
    messagelist: any
    messageadd: any
    messagedel: any
    messageget: any
    messageupdateflag: any
    complainlist: any
    complainadd: any
    complaindelall: any
    complaindel: any
    banclient: any
    banlist: any
    banadd: any
    bandel: any
    bandelall: any
    ftinitupload: any
    ftinitdownload: any
    ftlist: any
    ftgetfilelist: any
    ftgetfileinfo: any
    ftstop: any
    ftdeletefile: any
    ftcreatedir: any
    ftrenamefile: any
    customsearch: any
    custominfo: any
    whoami: TS_whoami
}
