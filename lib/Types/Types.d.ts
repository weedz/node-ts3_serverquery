declare type TS_ErrorState = {
    id: string|number,
    msg: string
};

// From commands
declare type TS_whoami = {
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
};

declare type TS_version = {
    version: string,
    build: number,
    platform: string
};

// Client types
declare type TS_ClientInfo = {
    cid: number,
    client_idle_time: number,
    client_unique_identifier: string,
    client_nickname: string,
    client_version: string,
    client_platform: string,
    client_input_muted: number|boolean,
    client_output_muted: number|boolean,
    client_outputonly_muted: number|boolean,
    client_input_hardware: number|boolean,
    client_output_hardware: number|boolean,
    client_default_channel?: number|null,
    client_meta_data?: string,
    client_is_recording: number|boolean,
    client_version_sign?: string,
    client_security_hash?: string,
    client_login_name?: string,
    client_database_id: number,
    client_channel_group_id: number,
    client_servergroups: Array<number>,
    client_created: number,
    client_lastconnected: number,
    client_totalconnections: number,
    client_away: number|boolean,
    client_away_message?: string,
    client_type: number,
    client_flag_avatar?: string,
    client_talk_power: number,
    client_talk_request: number,
    client_talk_request_msg?: string,
    client_description?: string,
    client_is_talker: number|boolean,
    client_month_bytes_uploaded: number,
    client_month_bytes_downloaded: number,
    client_total_bytes_uploaded: number,
    client_total_bytes_downloaded: number,
    client_is_priority_speaker: number|boolean,
    client_nickname_phonetic?: string,
    client_unread_messages?: number,
    client_needed_serverquery_view_power: number,
    client_default_token?: string,
    client_icon_id: number,
    client_is_channel_commander: number|boolean,
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
};

declare type TS_ClientListItem = {
    clid: number;
    cid: number;
    client_database_id: number;
    client_nickname: string;
    client_type: number;
}

declare type TS_ClientList = Array<TS_ClientListItem>;

// Channel types
declare enum TS_Codec {
    CODEC_SPEEX_NARROWBAND = 0,
    CODEC_SPEEX_WIDEBAND,
    CODEC_SPEEX_ULTRAWIDEBAND,
    CODEC_CELT_MONO,
    CODEC_OPUS_VOICE,
    CODEC_OPUS_MUSIC
}

declare type TS_ChannelInfo = {
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
    channel_flag_permanent: number|boolean,
    channel_flag_semi_permanent: number|boolean,
    channel_flag_default: number|boolean,
    channel_flag_password: number|boolean,
    channel_codec_latency_factor: number,
    channel_codec_is_unencrypted: number|boolean,
    channel_security_salt: string,
    channel_delete_delay: number,
    channel_flag_maxclients_unlimited: number|boolean,
    channel_flag_maxfamilyclients_unlimited: number|boolean,
    channel_flag_maxfamilyclients_inherited: number|boolean,
    channel_filepath: string,
    channel_needed_talk_power: number,
    channel_forced_silence: number|boolean,
    channel_name_phonetic: string|null,
    channel_icon_id: number,
    channel_flag_private: number|boolean,
    seconds_empty: number
};

declare type TS_ChannelListItem = {
    cid: number,
    pid: number,
    channel_order: number,
    channel_name: string,
    total_clients: number,
    channel_needed_subscribe_power: number
};

declare type TS_ChannelList = Array<TS_ChannelListItem>;
