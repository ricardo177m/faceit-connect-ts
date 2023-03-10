const REQUIRED_ENV_VARS = [
    "ALLOWED_DOMAINS",
    "DB_NAME",
    "DB_HOST",
    "DB_PW",
    "DB_USER",
    "PORT",
    "FACEIT_CLIENTID",
    "FACEIT_CLIENTSECRET",
    "APP_URL",
    "USERTOKEN",
    "TS3_HOST",
    "TS3_QUERYPORT",
    "TS3_SERVERPORT",
    "TS3_USERNAME",
    "TS3_PW",
    "LINKED_GID",
    "LOBBY_PARENT_CID",
    "ENABLE_PARTY",
    "LOBBY_MEMBER_CHANNELGID",
    "DEFAULT_CHANNELGID",
];

const REQUIRED_TABLES = ["link", "channel"];

// const REQUIRED_SETTINGS = ["update_text"];

module.exports = {
    requiredEnvVars: REQUIRED_ENV_VARS,
    requiredTables: REQUIRED_TABLES,
    // requiredSettings: REQUIRED_SETTINGS,
};
