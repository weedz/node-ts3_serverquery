export type TS_Flag = boolean|0|1;

// Definitions
export enum TS_HostMessageMode {
    HostMessageMode_NONE = 0,   // 0: don't display anything
    HostMessageMode_LOG,        // 1: display message in chatlog
    HostMessageMode_MODAL,      // 2: display message in modal dialog
    HostMessageMode_MODALQUIT   // 3: display message in modal dialog and close connection
}

export enum TS_HostBannerMode {
    HostBannerMode_NOADJUST = 0,    // 0: do not adjust
    HostBannerMode_IGNOREASPECT,    // 1: adjust but ignore aspect ratio (like TeamSpeak 2)
    HostBannerMode_KEEPASPECT       // 2: adjust and keep aspect ratio
}

export enum TS_Codec {
    CODEC_SPEEX_NARROWBAND = 0, // 0: speex narrowband (mono, 16bit, 8kHz)
    CODEC_SPEEX_WIDEBAND,       // 1: speex wideband (mono, 16bit, 16kHz)
    CODEC_SPEEX_ULTRAWIDEBAND,  // 2: speex ultra-wideband (mono, 16bit, 32kHz)
    CODEC_CELT_MONO,            // 3: celt mono (mono, 16bit, 48kHz)
    CODEC_OPUS_VOICE,
    CODEC_OPUS_MUSIC
}

export enum TS_CodecEncryptionMode {
    CODEC_CRYPT_INDIVIDUAL = 0, // 0: configure per channel
    CODEC_CRYPT_DISABLED,       // 1: globally disabled
    CODEC_CRYPT_ENABLED         // 2: globally enabled
}

export enum TS_TextMessageTargetMode {
    TextMessageTarget_CLIENT = 1,   // 1: target is a client
    TextMessageTarget_CHANNEL,      // 2: target is a channel
    TextMessageTarget_SERVER        // 3: target is a virtual server
}

export enum TS_LogLevel {
    LogLevel_ERROR = 1, // 1: everything that is really bad
    LogLevel_WARNING,   // 2: everything that might be bad
    LogLevel_DEBUG,     // 3: output that might help find a problem
    LogLevel_INFO       // 4: informational output
}

export enum TS_ReasonIdentifier {
    REASON_KICK_CHANNEL = 4,    // 4: kick client from channel
    REASON_KICK_SERVER          // 5: kick client from server
}

export enum TS_PermissionGroupDatabaseTypes {
    PermGroupDBTypeTemplate = 0,    // 0: template group (used for new virtual servers)
    PermGroupDBTypeRegular,         // 1: regular group (used for regular clients)
    PermGroupDBTypeQuery            // 2: global query group (used for ServerQuery clients)
}

export enum TS_PermissionGroupTypes {
    PermGroupTypeServerGroup = 0,   // 0: server group permission
    PermGroupTypeGlobalClient,      // 1: client specific permission
    PermGroupTypeChannel,           // 2: channel specific permission
    PermGroupTypeChannelGroup,      // 3: channel group permission
    PermGroupTypeChannelClient      // 4: channel-client specific permission
}

export enum TS_TokenType {
    TokenServerGroup = 0,   // 0: server group token (id1={groupID} id2=0)
    TokenChannelGroup       // 1: channel group token (id1={groupID} id2={channelID})
}

export type TS_VirtualServerStatus = "online" | "virtual online" | "offline" | "booting up" | "shutting down" | string;
export type TS_BindingSubsystem = "voice" | "query" | "filetransfer";
export interface TS_whoami {
    virtualserver_status: string,
    virtualserver_id: number,
    virtualserver_unique_identifier: string,
    virtualserver_port: number,
    client_id: number,
    client_channel_id: number,
    client_nickname: string,
    client_database_id: number,
    client_login_name: string,
    client_unique_identifier: string,
    client_origin_server_id: number
}

export interface TS_version {
    version: string,
    build: number,
    platform: string
}

// Client types
export interface TS_ClientInfo {
    cid: number,
    client_idle_time: number,
    client_unique_identifier: string,
    client_nickname: string,
    client_version: string,
    client_platform: string,
    client_input_muted: TS_Flag,
    client_output_muted: TS_Flag,
    client_outputonly_muted: TS_Flag,
    client_input_hardware: TS_Flag,
    client_output_hardware: TS_Flag,
    client_default_channel?: number|null,
    client_meta_data?: string,
    client_is_recording: TS_Flag,
    client_version_sign?: string,
    client_security_hash?: string,
    client_login_name?: string,
    client_database_id: number,
    client_channel_group_id: number,
    client_servergroups: Array<number>,
    client_created: number,
    client_lastconnected: number,
    client_totalconnections: number,
    client_away: TS_Flag,
    client_away_message?: string,
    client_type: number,
    client_flag_avatar?: string,
    client_talk_power: number,
    client_talk_request: number,
    client_talk_request_msg?: string,
    client_description?: string,
    client_is_talker: TS_Flag,
    client_month_bytes_uploaded: number,
    client_month_bytes_downloaded: number,
    client_total_bytes_uploaded: number,
    client_total_bytes_downloaded: number,
    client_is_priority_speaker: TS_Flag,
    client_nickname_phonetic?: string,
    client_unread_messages?: number,
    client_needed_serverquery_view_power: number,
    client_default_token?: string,
    client_icon_id: number,
    client_is_channel_commander: TS_Flag,
    client_channel_group_inherited_channel_id: number,
    client_badges?: string,
    client_myteamspeak_id?: string,
    client_integrations?: string,
    client_base64HashClientUID?: string,
    connection_filetransfer_bandwidth_sent: number,
    connection_filetransfer_bandwidth_received: number,
    connection_packets_sent_total: number,
    connection_bytes_sent_total: number,
    connection_packets_received_total: number,
    connection_bytes_received_total: number,
    connection_bandwidth_sent_last_second_total: number,
    connection_bandwidth_sent_last_minute_total: number,
    connection_bandwidth_received_last_second_total: number,
    connection_bandwidth_received_last_minute_total: number,
    connection_connected_time: number,
    connection_client_ip: string
}

export interface TS_ClientListItem {
    clid: number;
    cid: number;
    client_database_id: number;
    client_nickname: string;
    client_type: number;
}

export type TS_ClientList = Array<TS_ClientListItem>;

// Channel types
export interface TS_ChannelInfo {
    pid: number,
    channel_name: string,
    channel_topic: string,
    channel_description: string,
    channel_password: string|null,
    channel_codec: TS_Codec,
    channel_codec_quality: number,
    channel_maxclients: number,
    channel_maxfamilyclients: number,
    channel_order: number,
    channel_flag_permanent: TS_Flag,
    channel_flag_semi_permanent: TS_Flag,
    channel_flag_default: TS_Flag,
    channel_flag_password: TS_Flag,
    channel_codec_latency_factor: number,
    channel_codec_is_unencrypted: TS_Flag,
    channel_security_salt: string,
    channel_delete_delay: number,
    channel_flag_maxclients_unlimited: TS_Flag,
    channel_flag_maxfamilyclients_unlimited: TS_Flag,
    channel_flag_maxfamilyclients_inherited: TS_Flag,
    channel_filepath: string,
    channel_needed_talk_power: number,
    channel_forced_silence: TS_Flag,
    channel_name_phonetic: string|null,
    channel_icon_id: number,
    channel_flag_private: TS_Flag,
    seconds_empty: number
}

export interface TS_ChannelListItem {
    cid: number,
    pid: number,
    channel_order: number,
    channel_name: string,
    total_clients: number,
    channel_needed_subscribe_power: number
}

export type TS_ChannelList = Array<TS_ChannelListItem>;

export interface TS_InstanceProperties {
    readonly instance_uptime: number,
    readonly host_timestamp_utc: string,
    readonly virtualservers_running_total: number,
    readonly connection_filetransfer_bandwidth_sent: number,
    readonly connection_filetransfer_bandwidth_received: number,
    readonly connection_packets_sent_total: number,
    readonly connection_packets_received_total: number,
    readonly connection_bytes_sent_total: number,
    readonly connection_bytes_received_total: number,
    readonly connection_bandwidth_sent_last_second_total: number,
    readonly connection_bandwidth_received_last_second_total: number,
    readonly connection_bandwidth_sent_last_minute_total: number,
    readonly connection_bandwidth_received_last_minute_total: number,
    readonly serverinstance_database_version: string,
    serverinstance_guest_serverquery_group: number,
    serverinstance_template_serveradmin_group: number,
    serverinstance_filetransfer_port: number,
    serverinstance_max_download_total_bandwitdh: number,
    serverinstance_max_upload_total_bandwitdh: number,
    serverinstance_template_serverdefault_group: number,
    serverinstance_template_channeldefault_group: number,
    serverinstance_template_channeladmin_group: number,
    readonly virtualservers_total_maxclients: number,
    readonly virtualservers_total_clients_online: number,
    readonly virtualservers_total_channels_online: number,
    serverinstance_serverquery_flood_commands: number,
    serverinstance_serverquery_flood_time: number,
    serverinstance_serverquery_flood_ban_time: number
}

export interface TS_VirtualServerProperties {
    virtualserver_name: string,
    virtualserver_welcomemessage: string,
    virtualserver_maxclients: number,
    virtualserver_password: string,
    readonly virtualserver_flag_password: TS_Flag,
    readonly virtualserver_clientsonline: number,
    readonly virtualserver_queryclientsonline: number,
    readonly virtualserver_channelsonline: number,
    readonly virtualserver_created: string,
    readonly virtualserver_uptime: number,
    virtualserver_hostmessage: string,
    virtualserver_hostmessage_mode: TS_HostMessageMode,
    virtualserver_default_server_group: number,
    virtualserver_default_channel_group: number,
    virtualserver_default_channel_admin_group: number,
    readonly virtualserver_platform: string,
    readonly virtualserver_version: string,
    virtualserver_max_download_total_bandwidth: number,
    virtualserver_max_upload_total_bandwidth: number,
    virtualserver_hostbanner_url: string,
    virtualserver_hostbanner_gfx_url: string,
    virtualserver_hostbanner_gfx_interval: number,
    virtualserver_complain_autoban_count: number,
    virtualserver_complain_autoban_time: number,
    virtualserver_complain_remove_time: number,
    virtualserver_min_clients_in_channel_before_forced_silence: number,
    virtualserver_priority_speaker_dimm_modificator: number,
    virtualserver_antiflood_points_tick_reduce: number,
    virtualserver_antiflood_points_needed_command_block: number,
    virtualserver_antiflood_points_needed_plugin_block: number,
    virtualserver_antiflood_points_needed_ip_block: number,
    virtualserver_hostbanner_mode: TS_HostBannerMode,
    readonly virtualserver_ask_for_privilegekey: TS_Flag // Flag?
    readonly virtualserver_client_connections: number,
    readonly virtualserver_query_client_connections: number,
    virtualserver_hostbutton_tooltip: string,
    virtualserver_hostbutton_gfx_url: string,
    virtualserver_hostbutton_url: string,
    virtualserver_download_quota: number,
    virtualserver_upload_quota: number,
    readonly virtualserver_month_bytes_downloaded: number,
    readonly virtualserver_month_bytes_uploaded: number,
    readonly virtualserver_total_bytes_downloaded: number,
    readonly virtualserver_total_bytes_uploaded: number,
    readonly virtualserver_unique_identifer: number,
    readonly virtualserver_id: number,
    virtualserver_machine_id: number,
    virtualserver_port: number,
    virtualserver_autostart: TS_Flag // Flag,
    readonly connection_filetransfer_bandwidth_sent: number,
    readonly connection_filetransfer_bandwidth_received: number,
    readonly connection_packets_sent_total: number,
    readonly connection_packets_received_total: number,
    readonly connection_bytes_sent_total: number,
    readonly connection_bytes_received_total: number,
    readonly connection_bandwidth_sent_last_second_total: number,
    readonly connection_bandwidth_received_last_second_total: number,
    readonly connection_bandwidth_sent_last_minute_total: number,
    readonly connection_bandwidth_received_last_minute_total: number,
    virtualserver_status: TS_VirtualServerStatus,
    virtualserver_log_client: TS_Flag,
    virtualserver_log_query: TS_Flag,
    virtualserver_log_channel: TS_Flag,
    virtualserver_log_permissions: TS_Flag,
    virtualserver_log_server: TS_Flag,
    virtualserver_log_filetransfer: TS_Flag,
    virtualserver_min_client_version: string,
    virtualserver_min_android_version: string,
    virtualserver_min_ios_version: string,
    virtualserver_min_winphone_version: string, // <-- Windows phone...
    virtualserver_needed_identity_security_level: number,
    virtualserver_name_phonetic: string,
    virtualserver_icon_id: string,
    virtualserver_reserved_slots: number,
    readonly virtualserver_total_packetloss_speech: string,
    readonly virtualserver_total_packetloss_keepalive: string,
    readonly virtualserver_total_packetloss_control: string,
    readonly virtualserver_total_packetloss_total: string,
    readonly virtualserver_total_ping: number,
    readonly virtualserver_ip: string, // IPv4
    virtualserver_weblist_enabled: TS_Flag,
    virtualserver_codec_encryption_mode: TS_CodecEncryptionMode,
    readonly virtualserver_filebase: string
}

export interface TS_ChannelProperties {
    channel_name: string,
    channel_topic: string,
    channel_description: string,
    channel_password: string,
    readonly channel_flag_password: TS_Flag,
    channel_codec: TS_Codec,
    channel_codec_quality: number,
    channel_maxclients: number,
    channel_maxfamilyclients: number,
    channel_order: number,
    channel_flag_permanent: TS_Flag,
    channel_flag_semi_permanent: TS_Flag,
    channel_flag_temporary: TS_Flag,
    channel_flag_default: TS_Flag,
    channel_flag_maxclients_unlimited: TS_Flag,
    channel_flag_maxfamilyclients_unlimited: TS_Flag,
    channel_flag_maxfamilyclients_inherited: TS_Flag,
    channel_needed_talk_power: number,
    channel_name_phonetic: string,
    readonly channel_filepath: string,
    readonly channel_forced_silence: TS_Flag,
    channel_icon_id: string,
    channel_codec_is_unencrypted: TS_Flag,
    cpid: number,
    readonly cid: number,
}

export interface TS_ClientProperties {
    readonly client_unique_identifier: string,
    client_nickname: string,
    readonly client_version: string,
    readonly client_platform: string,
    readonly client_input_muted: TS_Flag,
    readonly client_output_muted: TS_Flag,
    readonly client_input_hardware: TS_Flag,
    readonly client_output_hardware: TS_Flag,
    readonly client_default_channel: number,
    readonly client_login_name: string,
    readonly client_database_id: number,
    readonly client_channel_group_id: number,
    readonly client_server_groups: string,
    readonly client_created: number,
    readonly client_lastconnected: number,
    readonly client_totalconnections: number,
    readonly client_away: TS_Flag,
    readonly client_away_message: string,
    readonly client_type: TS_Flag,
    readonly client_flag_avatar: TS_Flag,
    readonly client_talk_power: number,
    readonly client_talk_request: TS_Flag,
    readonly client_talk_request_msg: string,
    client_is_talker: TS_Flag,
    readonly client_month_bytes_downloaded: number,
    readonly client_month_bytes_uploaded: number,
    readonly client_total_bytes_downloaded: number,
    readonly client_total_bytes_uploaded: number,
    readonly client_is_priority_speaker: TS_Flag,
    readonly client_unread_messages: number,
    readonly client_nickname_phonetic: string,
    client_description: string,
    readonly client_needed_serverquery_view_power: number,
    readonly connection_filetransfer_bandwidth_sent: number,
    readonly connection_filetransfer_bandwidth_received: number,
    readonly connection_packets_sent_total: number,
    readonly connection_packets_received_total: number,
    readonly connection_bytes_sent_total: number,
    readonly connection_bytes_received_total: number,
    readonly connection_bandwidth_sent_last_second_total: number,
    readonly connection_bandwidth_received_last_second_total: number,
    readonly connection_bandwidth_sent_last_minute_total: number,
    readonly connection_bandwidth_received_last_minute_total: number,
    readonly connection_client_ip: string,
    client_is_channel_commander: TS_Flag,
    client_icon_id: string,
    readonly client_country: string,
}
