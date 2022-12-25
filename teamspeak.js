const { TeamSpeak } = require("ts3-nodejs-library");
const colors = require("@colors/colors/safe");
const { config } = require("./config/config");
const Linkage = require("./utils/Linkage");
const Faceit = require("./utils/Faceit");
const EventHandler = require("./utils/EventHandler");
const CheckLobbyChannel = require("./utils/CheckLobbyChannel");

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
        if (lobby === null) {
            if (process.env.ENABLE_PARTY === "true") lobby = await Faceit.getParty(playerId);
            if (lobby === null) return;
        }
        const isOwner = playerId === lobby.owner;
        CheckLobbyChannel(lobby.id, lobby.name, isOwner, client, teamspeak);
    }

    teamspeak.on("ready", async () => {
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

            // linked, add client to server group "Linked" if not already in
            addToLinkedGroup(client);
            checkLobby(status.faceit_id, client);
        });

        app.on("successfulLink", async (data) => {
            const client = await teamspeak.getClientByUid(data.uuid);
            if (!client) return;
            teamspeak.sendTextMessage(client.clid, 1, config.teamspeak.successfulLinkMsg.replace("<NICKNAME>", data.nickname));
            addToLinkedGroup(client);
            checkLobby(data.faceitId, client);
        });

        app.on("lobbyEvent", async (event) => EventHandler(event, teamspeak));

        app.on("unlinked", async (uuid) => {
            const clients = await teamspeak.serverGroupClientList(process.env.LINKED_GID);

            const find = clients.find((client) => client.clientUniqueIdentifier === uuid);
            if (!find) return;

            await teamspeak.serverGroupDelClient(find.cldbid, process.env.LINKED_GID);
        });

        teamspeak.on("textmessage", (event) => {
            if ("TEST" in process.env && process.env.TEST === "1") {
                if (event.msg == "!getcid") teamspeak.sendTextMessage(event.invoker.clid, 1, event.invoker.cid);
            }
        });

        teamspeak.on("close", async () => {
            console.log("Disconnected, trying to reconnect...");
            await teamspeak.reconnect(-1, config.teamspeak.reconnectDelay);
            console.log("Reconnected!");
        });
    });

    return teamspeak;
};
