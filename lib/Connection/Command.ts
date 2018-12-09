import { CommandOptions } from "./CommandOptions";

export type Command = {
    label: string;
    commandStr: string;
    command: Function,
    resolve: Function,
    reject: Function,
    options: CommandOptions,
    failed?: boolean
};
