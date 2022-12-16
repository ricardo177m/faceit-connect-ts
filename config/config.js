const PORT = process.env.PORT || 3000;
const CONFIG = {
    clanId: "61395179-2483-49c9-a9b2-dd251a5ca0e0",

    faceitEndpoints: {
        lobbies: "https://api.faceit.com/lobby/v1/lobbies",
        oauthUserInfo: "https://api.faceit.com/auth/v1/resources/userinfo",
        openidConfig: "https://api.faceit.com/auth/v1/openid_configuration",
        accounts: "https://accounts.faceit.com",
    },

    teamspeak: {
        nickname: "FACEIT PT Connect",
        notLinkedMsg:
            "\n\n[b]        Olá, [color=#ff5500]<NICKNAME>[/color]!\n\n" +
            "        Reparámos que não tens a tua FACEIT vinculada.\n" +
            "        Este TeamSpeak está ligado aos lobbys da comunidade portuguesa, ou seja,\n" +
            "        os jogadores que vinculam a conta são [color=#ff0000]automaticamente movidos[/color] para a sala do lobby!\n\n" +
            `        Para vinculares a tua conta, [url=${process.env.APP_URL}/link?token=<TOKEN>]carrega aqui[/url]!\n` +
            "        [color=#0cc43a]Bons jogos![/color]\n" +
            "[/b]",
        successfulLinkMsg: "[b]A tua FACEIT foi vinculada com sucesso, bem-vindo [color=#ff5500]<NICKNAME>[/color]![/b]",
        linkedGroupId: 9,
    },
};

module.exports = {
    config: CONFIG,
    port: PORT,
};
