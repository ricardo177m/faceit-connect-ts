const { config } = require("../config/config");
const CheckLobbyChannel = require("./CheckLobbyChannel");
const Faceit = require("./Faceit");
const Linkage = require("./Linkage");
const LobbyChannel = require("./LobbyChannel");

module.exports = (event, teamspeak) => {
    const handlers = {
        lobby_created: async (event, teamspeak) => {
            // creates a channel for the lobby if owner is in ts server
            const playerId = event.payload.entity.owner.id;

            const linkageStatus = await Linkage.getLinkageStatusByFaceitId(playerId);
            if (!linkageStatus) return; // player is not linked

            const client = await teamspeak.getClientByUid(linkageStatus.uuid);
            if (!client) return; // player is not in ts server

            const lobbyId = event.payload.entity.id;
            const lobbyName = event.payload.entity.description;

            CheckLobbyChannel(lobbyId, lobbyName, true, client, teamspeak);
        },

        lobby_updated: async (event, teamspeak) => {
            // change channel name if it was created by bot
            const lobbyId = event.payload.entity.id;
            const name = event.payload.entity.description;

            const channel_db = await LobbyChannel.getChannelByLobbyId(lobbyId);
            if (!channel_db || !channel_db.created_by_bot) return;

            LobbyChannel.updateLobbyChannel(channel_db.channel_id, name, teamspeak);
        },

        lobby_player_joined: async (event, teamspeak) => {
            // moves client to lobby channel if it exists and is online
            const lobbyId = event.payload.entity.lobby_id;
            const playerId = event.payload.entity.player.id;

            const linkageStatus = await Linkage.getLinkageStatusByFaceitId(playerId);
            if (!linkageStatus) return; // player is not linked

            const client = await teamspeak.getClientByUid(linkageStatus.uuid);
            if (!client) return; // player is not in ts server

            const lobbyData = await Faceit.getClanLobby(playerId);
            if (!lobbyData) return;

            const lobbyName = lobbyData.name;
            CheckLobbyChannel(lobbyId, lobbyName, false, client, teamspeak);
        },

        lobby_player_left: async (event, teamspeak) => {
            // removes channel member perms from client (if channel still exists)
            const lobbyId = event.payload.entity.lobby_id;
            const playerId = event.payload.entity.player_id;

            const channel_db = await LobbyChannel.getChannelByLobbyId(lobbyId);
            if (!channel_db) return;

            const linkageStatus = await Linkage.getLinkageStatusByFaceitId(playerId);
            if (!linkageStatus) return; // player is not linked

            await LobbyChannel.removeMemberPermission(channel_db.channel_id, linkageStatus.uuid, teamspeak, false);
            // check if new lobby owner is in ts server

            const lobby = await Faceit.getLobbyFromId(lobbyId);
            if (!lobby) return;
            
            const newOwnerLinkageStatus = await Linkage.getLinkageStatusByFaceitId(lobby.owner);
            if (!newOwnerLinkageStatus) return; // player is not linked

            // if new owner is in ts server, add owner permission
            await LobbyChannel.addMemberPermission(channel_db.channel_id, newOwnerLinkageStatus.uuid, true, teamspeak);

            if (config.teamspeak.kickIfLeftLobby) {
                // moves client to default channel if he is online and in lobby channel
                const client = await teamspeak.getClientByUid(linkageStatus.uuid);
                if (!client) return; // player is not in ts server

                if (client.cid === channel_db.channel_id.toString()) {
                    await LobbyChannel.moveClientToDefaultChannel(linkageStatus.uuid, teamspeak);
                    const msg = "[b]Foste removido do canal porque saíste do lobby.[/b]";
                    teamspeak.sendTextMessage(client.clid, 1, msg);
                }
            }
        },

        lobby_destroyed: async (event, teamspeak) => {
            // removes channel member perms from all members (if channel still exists)
            const lobbyId = event.payload.entity;

            const channel_db = await LobbyChannel.getChannelByLobbyId(lobbyId);
            if (!channel_db) return;

            const channel = await teamspeak.getChannelById(channel_db.channel_id.toString());
            if (!channel) return; // channel was deleted

            try {
                const perms = [process.env.LOBBY_MEMBER_CHANNELGID, process.env.LOBBY_LEADER_CHANNELGID];
                for (const perm of perms) {
                    const clients = await teamspeak.channelGroupClientList(perm, channel_db.channel_id);
                    for (const client of clients) LobbyChannel.removeMemberPermission(channel_db.channel_id, client.cldbid, teamspeak, true);
                }
            } catch (error) {
                // console.log(error);
                // channel does not exist anymore
            }

            // removes entry from db
            await LobbyChannel.removeChannelLobby(lobbyId);
        },
    };

    if (handlers[event.event] === undefined) return;
    handlers[event.event](event, teamspeak);
};
