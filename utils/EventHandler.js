module.exports = (event, teamspeak) => {
    if (handlers[event.event] === undefined) return;
    handlers[event.event](event, teamspeak);

    const handlers = {
        lobby_created: (event, teamspeak) => {
            // creates a channel for the lobby if owner is in ts server
            // and is in default channel or child channel of lobby parent channel
        },

        lobby_updated: (event, teamspeak) => {
            // change channel name if it was created by bot
            const name = event.payload.entity.description;
            
            // const channel = teamspeak.getChannelBy
            // if (channel === null) return;
            // channel.edit({ channelName: name });
        },

        lobby_player_joined: (event, teamspeak) => {
            // moves client to lobby channel if it exists and is online
        },

        lobby_player_left: (event, teamspeak) => {
            // moves client to default channel if he is online and in lobby channel
        },
    };
};
