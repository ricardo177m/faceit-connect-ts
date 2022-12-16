const PORT = process.env.PORT || 3000;
const CONFIG = {
    clanId: "61395179-2483-49c9-a9b2-dd251a5ca0e0",

    faceitEndpoints: {
        lobbies: "https://api.faceit.com/lobby/v1/lobbies",
        oauthUserInfo: "https://api.faceit.com/auth/v1/resources/userinfo",
        openidConfig: "https://api.faceit.com/auth/v1/openid_configuration",
    },
};

module.exports = {
    config: CONFIG,
    port: PORT,
};
