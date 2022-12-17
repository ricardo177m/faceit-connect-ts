const { TeamSpeak } = require("ts3-nodejs-library");
const colors = require("@colors/colors/safe");
const { config } = require("./config/config");
const Linkage = require("./utils/Linkage");
const Faceit = require("./utils/Faceit");
const Generator = require("./utils/Generator");

module.exports = (app) => {
    const teamspeak = new TeamSpeak({
        host: process.env.TS3_HOST,
        queryport: process.env.TS3_QUERYPORT,
        serverport: process.env.TS3_SERVERPORT,
        username: process.env.TS3_USERNAME,
        password: process.env.TS3_PW,
        nickname: config.teamspeak.nickname,
    });

    function addToLinkedGroup(client) {
        const linkedGroupId = process.env.LINKED_GID;
        if (client.servergroups.includes(linkedGroupId)) return;
        teamspeak.clientAddServerGroup(client.databaseId, linkedGroupId);
    }

    async function checkLobby(playerId, client) {
        // check lobby or party
        let lobby = await Faceit.getClanLobby(playerId);
        if (lobby === null && process.env.ENABLE_PARTY === "true")
            lobby = await Faceit.getParty(playerId);
        if (lobby === null) return;

        // check if there is a channel for the lobby
        let channel = await teamspeak.getChannelByName(lobby.name);
        if (!channel) {
            channel = await teamspeak.channelCreate(lobby.name, {
                channelMaxclients: 5,
                channelFlagMaxclientsUnlimited: false,
                cpid: process.env.LOBBY_PARENT_CID,
                channelPassword: Generator.generateToken(),
            });
        }
        try {
            await teamspeak.clientMove(client.clid, channel.cid);
        } catch (error) {} // client made request but left too early the ts server
        teamspeak.clientMove((await teamspeak.whoami()).clientId, process.env.LOBBY_PARENT_CID); // move server query to another channel
    }

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
            addToLinkedGroup(client);

            checkLobby(status.faceit_id, client);
        });

        teamspeak.on("clientdisconnect", async (event) => {
            // search for all child channels of the lobby parent channel
            const channels = await teamspeak.channelList({ pid: process.env.LOBBY_PARENT_CID });
            channels.forEach(async (channel) => {
                // if empty delete
                if (channel.totalClients === 0) await teamspeak.channelDelete(channel.cid, true);
            });
        });

        app.on("successfulLink", async (data) => {
            const client = await teamspeak.getClientByUid(data.uuid);
            if (!client) return;
            teamspeak.sendTextMessage(client.clid, 1, config.teamspeak.successfulLinkMsg.replace("<NICKNAME>", data.nickname));
            addToLinkedGroup(client);
            checkLobby(data.faceitId, client);
        });

        teamspeak.on("textmessage", (event) => {
            if ("TEST" in process.env && process.env.TEST === "1") {
                if (event.msg == "!getcid") teamspeak.sendTextMessage(event.invoker.clid, 1, event.invoker.cid);
            }
        });

        teamspeak.on("close", async () => {
            console.log("Disconnected, trying to reconnect...");
            await teamspeak.reconnect(-1, 10000);
            console.log("Reconnected!");
        });
    });

    return teamspeak;
};