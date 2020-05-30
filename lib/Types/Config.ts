export type AuthOptions = {
    username: string;
    password: string;
    host: string;
    port: number;
};

export type BotConfig = {
    logLevel: number;
    auth: AuthOptions;
    plugins: string[];
    defaultServer: number;
    nickname: string
};
