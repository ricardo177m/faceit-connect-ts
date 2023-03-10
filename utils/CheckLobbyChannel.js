const LobbyChannel = require("./LobbyChannel");

module.exports = async (lobbyId, lobbyName, isOwner, client, teamspeak) => {
    let channel_db = await LobbyChannel.getChannelByLobbyId(lobbyId);

    // lobby channel already exists
    if (channel_db !== null) {
        // console.log(channel_db.channel_id);
        const channel = await teamspeak.getChannelById(channel_db.channel_id.toString());
        // console.log(channel);
        if (channel) {
            const wasMoved = await LobbyChannel.moveClientToLobbyChannel(channel_db.channel_id, client.clid, teamspeak);
            if (wasMoved) {
                const msg = "[b]Foste automaticamente movido para a sala do teu lobby. [color=#ff5500]Bom jogo![/color][/b]";
                teamspeak.sendTextMessage(client.clid, 1, msg);
            }
            LobbyChannel.addMemberPermission(channel_db.channel_id, client.uniqueIdentifier, isOwner, teamspeak);
            return;
        }
        await LobbyChannel.removeChannelLobby(lobbyId);
    }

    const isPotentialLobbyChannel = await LobbyChannel.isClientChannelPotentialLobbyChannel(client.cid, teamspeak);

    if (isPotentialLobbyChannel) {
        // is channel a child of lobby channel?
        const isChild = await LobbyChannel.isParentLobbyChannel(client.cid, teamspeak);
        await LobbyChannel.setLobbyChannel(lobbyId, client.cid, isChild);
        await LobbyChannel.addMemberPermission(client.cid, client.uniqueIdentifier, isOwner, teamspeak);
        const msg = "[b]Esta sala está agora associada ao teu lobby. [color=#ff5500]Bom jogo![/color][/b]";
        teamspeak.sendTextMessage(client.clid, 1, msg);
        return;
    }

    // create a lobby channel
    const newChannelId = await LobbyChannel.createLobbyChannel(lobbyName, teamspeak);
    if (newChannelId === null) return;
    await LobbyChannel.setLobbyChannel(lobbyId, newChannelId, true);
    await LobbyChannel.addMemberPermission(newChannelId, client.uniqueIdentifier, isOwner, teamspeak);
    // move client to lobby channel
    await LobbyChannel.moveClientToLobbyChannel(newChannelId, client.clid, teamspeak);

    const msg = "[b]Foi criada uma sala para o teu lobby. [color=#ff5500]Bom jogo![/color][/b]";
    teamspeak.sendTextMessage(client.clid, 1, msg);

    // move server query to another channel
    LobbyChannel.moveServerQueryToLobbyParentChannel(teamspeak);
};
