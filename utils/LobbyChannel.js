const dbpool = require("../services/db");
const Generator = require("./Generator");

module.exports = {
    getChannelByLobbyId: async (lobbyId) => {
        const sql = "SELECT * FROM channel WHERE lobby_id = ?";
        const params = [lobbyId];
        const [result] = await dbpool.query(sql, params);
        if (!result.length) return null;
        return result[0];
    },

    removeChannelLobby: async (lobbyId) => {
        const sql = "DELETE FROM channel WHERE lobby_id = ?";
        const params = [lobbyId];
        await dbpool.query(sql, params);
    },

    isChannelLobbyChannel: async (channelId) => {
        const sql = "SELECT * FROM channel WHERE channel_id = ?";
        const params = [channelId];
        const [result] = await dbpool.query(sql, params);
        return result.length !== 0;
    },

    createLobbyChannel: async (lobbyName, teamspeak) => {
        try {
            const check = await teamspeak.getChannelByName(lobbyName);
            if (check) lobbyName = lobbyName + Generator.generateString(3);
            const channel = await teamspeak.channelCreate(lobbyName, {
                channelMaxclients: 5,
                channelFlagMaxclientsUnlimited: false,
                cpid: process.env.LOBBY_PARENT_CID,
            });
            await teamspeak.channelSetPerms(channel.cid, [
                { permsid: "i_channel_needed_modify_power", permvalue: 75 },
                { permsid: "i_channel_needed_join_power", permvalue: 55 },
            ]);
            return channel.cid;
        } catch (error) {
            console.log(error);
            return null;
        }
    },

    setLobbyChannel: async (lobbyId, channelId, byBot) => {
        const sql = "INSERT INTO channel (channel_id, lobby_id, created_by_bot) VALUES (?,?,?)";
        const params = [channelId, lobbyId, byBot ? 1 : 0];
        const [result] = await dbpool.query(sql, params);
        return result.affectedRows !== 0;
    },

    updateLobbyChannel: async (channelId, lobbyName, teamspeak) => {
        try {
            await teamspeak.channelEdit(channelId, { channelName: lobbyName });
        } catch (error) {
            // console.log(error);
            // channel name in use
        }
    },

    moveClientToLobbyChannel: async (channelId, clientId, teamspeak) => {
        try {
            const client = await teamspeak.getClientById(clientId.toString());
            if (!client) return;
            if (client.cid === channelId) return;
            await teamspeak.clientMove(clientId, channelId);
        } catch (error) {} // client made request but left too early the ts server
    },

    moveClientToDefaultChannel: async (clientUid, teamspeak) => {
        try {
            const client = await teamspeak.getClientByUid(clientUid.toString());
            if (!client) return;
            await client.kickFromChannel();
        } catch (error) {
            console.log(error);
        }
    },

    moveServerQueryToLobbyParentChannel: async (teamspeak) => {
        try {
            await teamspeak.clientMove((await teamspeak.whoami()).clientId, process.env.LOBBY_PARENT_CID);
        } catch (error) {
            console.log(error);
        }
    },

    addMemberPermission: async (channelId, clientUid, teamspeak) => {
        try {
            // check if client has a different permission than default
            const client = await teamspeak.getClientByUid(clientUid);
            if (!client) return;
            if (client.cid === channelId) return;
            await teamspeak.setClientChannelGroup(process.env.LOBBY_MEMBER_CHANNELGID, channelId, client.databaseId);
        } catch (error) {
            console.log(error);
        }
    },

    removeMemberPermission: async (channelId, clientId, teamspeak, isCldbid) => {
        try {
            let cldbid = clientId;
            if (!isCldbid) {
                const client = await teamspeak.getClientByUid(clientId);
                if (!client) return;
                if (client.cid === channelId) return;
                cldbid = client.databaseId;
            }
            await teamspeak.setClientChannelGroup(process.env.DEFAULT_CHANNELGID, channelId.toString(), cldbid);
        } catch (error) {
            console.log(error);
        }
    },

    isClientChannelPotentialLobbyChannel: async (channelId, teamspeak) => {
        try {
            const channel = await teamspeak.getChannelById(channelId.toString());
            if (!channel) return false;
            // default channel cannot be lobby channel
            if (channel.flagDefault) return false;
            // child channels of lobby parent channel already are lobby channels
            if (channel.pid == process.env.LOBBY_PARENT_CID) return false;
            // if channel is already lobby channel then it can't be used
            const sql = "SELECT * FROM channel WHERE channel_id = ?";
            const params = [channelId];
            const [result] = await dbpool.query(sql, params);
            return result.length === 0;
        } catch (error) {
            console.log(error);
            return false;
        }
    },
};
