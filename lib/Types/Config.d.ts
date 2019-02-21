declare type AuthOptions = {
    username: string;
    password: string;
    host: string;
    port: number;
};

declare type BotConfig = {
    logLevel: number;
    auth: AuthOptions;
    plugins: string[];
    defaultServer: number;
    nickname: string
};
