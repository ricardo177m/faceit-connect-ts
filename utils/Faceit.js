const { config } = require("../config/config");
const axios = require("axios");

module.exports = {
    getClanLobby: async (faceitPlayerId) => {
        const url = `${config.faceitEndpoints.lobbies}?entity_id=${config.clanId}`;
        let options = {
            headers: {
                "Cache-Control": "no-cache",
                Pragma: "no-cache",
                Expires: "0",
            },
        };
        const token = process.env.USERTOKEN;
        if (token !== null) options.headers["Authorization"] = `Bearer ${token}`;

        function searchInLobby(lobbyPlayers, userid) {
            for (var i = 0; i < lobbyPlayers.length; i++) if (lobbyPlayers[i].id === userid) return true;
        }

        return axios
            .get(url, options)
            .then((response) => {
                for (var i = 0; i < response.data.payload.length; i++) {
                    if (searchInLobby(response.data.payload[i].current_players, faceitPlayerId)) {
                        let ids = [];
                        for (let j = 0; j < response.data.payload[i].current_players.length; j++) ids.push(response.data.payload[i].current_players[j].id);

                        return {
                            type: "lobby",
                            name: response.data.payload[i].name,
                            id: response.data.payload[i].id,
                            members: ids,
                            exists: true,
                        };
                    }
                }
                return null;
            })
            .catch((error) => {
                return null;
            });
    },
};
