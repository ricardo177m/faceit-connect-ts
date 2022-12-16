const { TeamSpeak } = require("ts3-nodejs-library");
const colors = require("@colors/colors/safe");
const { config } = require("./config/config");
const Linkage = require("./utils/Linkage");

module.exports = (app) => {
    const teamspeak = new TeamSpeak({
        host: process.env.TS3_HOST,
        queryport: process.env.TS3_QUERYPORT,
        serverport: process.env.TS3_SERVERPORT,
        username: process.env.TS3_USERNAME,
        password: process.env.TS3_PW,
        nickname: config.teamspeak.nickname,
    });

    teamspeak.on("ready", () => {
        console.log(`${colors.green("[✔]")} TeamSpeak ready`);

        teamspeak.on("clientconnect", async (event) => {
            const client = event.client;

            // check if client already linked its account
            const status = await Linkage.getLinkageStatusByUUID(client.uniqueIdentifier);
            let token = "";
            if (status === null) token = await Linkage.createToken(client.uniqueIdentifier);
            else token = status.token;

            if (status === null || status.faceit_id === null) {
                // not linked, send message
                const msg = config.teamspeak.notLinkedMsg.replace("<NICKNAME>", client.nickname).replace("<TOKEN>", token);
                teamspeak.sendTextMessage(client.clid, 1, msg);
                return;
            }

            // linked, check if client is in default channel
            // const channel = await teamspeak.getChannelById(client.cid);
            // if (!channel.flagDefault) return;

            // add client to server group "Linked" if not already in
            const isOnGroup = client.servergroups.find((group) => group == config.teamspeak.linkedGroupId);
            if (!isOnGroup) client.addGroups([config.teamspeak.linkedGroupId]);
        });

        app.on("successfulLink", async (data) => {
            const client = await teamspeak.getClientByUid(data.uuid);
            if (client === undefined || client === null) return;
            teamspeak.sendTextMessage(client.clid, 1, config.teamspeak.successfulLinkMsg.replace("<NICKNAME>", data.nickname));
            teamspeak.clientAddServerGroup(client.databaseId, config.teamspeak.linkedGroupId);
        });

        teamspeak.on("textmessage", () => {});

        teamspeak.on("close", async () => {
            console.log("Disconnected, trying to reconnect...");
            await teamspeak.reconnect(-1, 10000);
            console.log("Reconnected!");
        });
    });

    return teamspeak;
};
