declare type CommandOptions = {
    noOutput?: boolean,
    expectData?: boolean,
    mustReturnOK?: boolean
};

declare type Command = {
    label: string;
    commandStr: string;
    command: Function,
    resolve: Function,
    reject: Function,
    options: CommandOptions,
    failed?: boolean
};
