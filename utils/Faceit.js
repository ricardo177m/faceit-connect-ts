const { config } = require("../config/config");
const axios = require("axios");

module.exports = {
    /**
     * É possível obter o ID da party efetuando um pedido
     * à seguinte endpoint e obter active_team_id:
     *      https://api.faceit.com/core/v1/users/{playerID}
     * ... e depois obter members_ids da seguinte endpoint:
     *      https://api.faceit.com/core/v1/teams/{partyID}
     *
     * Para o lobby, é necessário efetuar um pedido à
     * seguinte endpoint com autenticação com token de
     * sessão de um utilizador pertencente ao clã:
     *      https://api.faceit.com/lobby/v1/lobbies?entity_id={clanID}
     */

    getLobbyFromId: async (lobbyId) => {
        const url = `${config.faceitEndpoints.lobbies}/${lobbyId}?entity_id=${config.clanId}`;
        let options = {
            headers: {
                "Cache-Control": "no-cache",
                Pragma: "no-cache",
                Expires: "0",
            },
        };
        const token = process.env.USERTOKEN;
        if (token !== null) options.headers["Authorization"] = `Bearer ${token}`;

        return axios
            .get(url, options)
            .then((response) => {
                let ids = [];
                for (let i = 0; i < response.data.payload.current_players.length; i++) ids.push(response.data.payload.current_players[i].id);
                return {
                    type: "lobby",
                    name: response.data.payload.description,
                    id: response.data.payload.id,
                    members: ids,
                    owner: response.data.payload.owner.id,
                };
            })
            .catch(() => null);
    },

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
                            name: response.data.payload[i].description,
                            id: response.data.payload[i].id,
                            members: ids,
                            owner: response.data.payload[i].owner.id,
                        };
                    }
                }
                return null;
            })
            .catch(() => null);
    },

    getParty: async (faceitPlayerId) => {
        let url = `${config.faceitEndpoints.user}/${faceitPlayerId}`;
        let options = {
            headers: {
                "Cache-Control": "no-cache",
                Pragma: "no-cache",
                Expires: "0",
            },
        };
        const token = process.env.USERTOKEN;
        if (token !== null) options.headers["Authorization"] = `Bearer ${token}`;

        const userPartyId = await axios
            .get(url, options)
            .then((response) => response.data.payload.active_team_id)
            .catch(() => null);

        if (!userPartyId) return null;

        url = `${config.faceitEndpoints.party}/${userPartyId}`;

        return axios
            .get(url, options)
            .then((response) => {
                return {
                    type: "party",
                    name: response.data.name,
                    id: response.data.id,
                    members: [...response.data.members_ids, ...response.data.pending_members_ids],
                    owner: response.data.leader,
                };
            })
            .catch(() => null);
    },
};
