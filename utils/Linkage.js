const dbpool = require("../services/db");
const Generator = require("./Generator");

module.exports = {
    /**
     * Retrieves the linkage status by uuid.
     *
     * @param {*} uuid TeamSpeak client unique id
     * @returns null if failed, linkage status if success
     */
    getLinkageStatusByUUID: async (uuid) => {
        const query = "SELECT * FROM link WHERE uuid = ?";
        const params = [uuid];

        const [linkage_res] = await dbpool.execute(query, params);

        if (!linkage_res.length) return null;
        return linkage_res[0];
    },

    /**
     * Retrieves the linkage status by token.
     *
     * @param {*} token generated token
     * @returns null if failed, linkage status if success
     */
    getLinkageStatusByToken: async (token) => {
        const query = "SELECT * FROM link WHERE token = ?";
        const params = [token];

        const [linkage_res] = await dbpool.execute(query, params);

        if (!linkage_res.length) return null;
        return linkage_res[0];
    },

    /**
     * Retrieves the linkage status by FACEIT uuid.
     * Beware: there can be multiple clients to a single FACEIT account.
     * If you use this and the player has multiple PCs and he enters/creates a clan, it won't be detected.
     * TODO: fix this.
     *
     * @param {*} faceitId FACEIT uuid
     * @returns null if failed, linkage status if success
     */
    getLinkageStatusByFaceitId: async (faceitId) => {
        const query = "SELECT * FROM link WHERE faceit_id = ? ORDER BY linked_at DESC";
        const params = [faceitId];

        const [linkage_res] = await dbpool.execute(query, params);

        if (!linkage_res.length) return null;
        return linkage_res[0];
    },

    /**
     * Creates a token for linkage.
     *
     * @param {*} uuid TeamSpeak client unique id
     * @returns null if failed, token if success
     */
    createToken: async (uuid) => {
        const token = Generator.generateString(6);
        const query = "INSERT INTO link (uuid, token) VALUES (?, ?)";
        const params = [uuid, token];

        const [insert_res] = await dbpool.execute(query, params);

        if (!insert_res.affectedRows) return null;
        return token;
    },

    /**
     * Completes the linkage process.
     *
     * @param {*} token geneated token
     * @param {*} faceitId profile id
     * @param {*} nickname profile nickname
     * @returns false if failed, true if success
     */
    linkProfile: async (token, faceitId, nickname) => {
        const query = "UPDATE link set token = null, faceit_id = ?, nickname = ?, linked_at = CURRENT_TIMESTAMP() WHERE token = ?";
        const params = [faceitId, nickname, token];
        const [update_res] = await dbpool.execute(query, params);

        if (!update_res.affectedRows) return false;
        return true;
    },
};
