export type TSEvent_ClientMoved = {
    clid: number,
    ctid: number,
    reasonid: number,
    reasonmsg?: string,
    invokerid?: number,
    invokername?: string,
    invokeruid?: string
};

export type TSEvent_ClientLeftView = {
    clid: number,
    cfid: number,
    ctid: number,
    reasonid: number,
    reasonmsg?: string,
    invokerid?: number,
    invokername?: string,
    invokeruid?: string
};

export type TSEvent_ClientEnterView = {
    cfid: number,
    ctid: number,
    reasonid: number,
    clid: number,
    client_unique_identifier: string,
    client_nickname: string,
    client_input_muted: number|boolean,
    client_output_muted: number|boolean,
    client_outputonly_muted: number|boolean,
    client_input_hardware: number|boolean,
    client_output_hardware: number|boolean,
    client_meta_data: string|null,
    client_is_recording: number|boolean,
    client_database_id: number,
    client_channel_group_id: number,
    client_servergroups: Array<number>,
    client_away: number|boolean,
    client_away_message: string|null,
    client_type: number,
    client_flag_avatar: string|null,
    client_talk_power: number,
    client_talk_request: number|boolean,
    client_talk_request_msg: string|null,
    client_description: string,
    client_is_talker: number|boolean,
    client_is_priority_speaker: number|boolean,
    client_unread_messages: number,
    client_nickname_phonetic: string|null,
    client_needed_serverquery_view_power: number,
    client_icon_id: number,
    client_is_channel_commander: number|boolean,
    client_country: string,
    client_channel_group_inherited_channel_id: number,
    client_badges: string|null,
    client_myteamspeak_id: string|null,
    client_integrations: string|null
}
