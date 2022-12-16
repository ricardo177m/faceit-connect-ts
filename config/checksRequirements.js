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
    "STEAM_API_KEY",
    "DEVPASSWORD",
];

const REQUIRED_TABLES = [
    "appeals",
    "countries",
    "logs",
    "logs_visitors",
    "notifications",
    "players",
    "player_votes",
    "reports",
    "sessions",
    "settings",
    "users",
    "v2_logs",
    "v2_visits",
    "v2_sockets",
    "v2_comments",
];

const REQUIRED_SETTINGS = ["update_text"];

module.exports = {
    requiredEnvVars: REQUIRED_ENV_VARS,
    requiredTables: REQUIRED_TABLES,
    requiredSettings: REQUIRED_SETTINGS,
};
