const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");

module.exports = {
    generateToken: () => {
        let token = crypto.randomBytes(36).toString("base64");
        token = token.replace(/\+/g, "-").replace(/\//g, "_");
        // token = token.toLowerCase().replace(/\+/g, "-").replace(/\//g, "_");

        return token;
    },

    generateString: (size) => {
        let token = crypto.randomBytes(size).toString("base64url");
        return token;
    },

    generateGuid: uuidv4,

    generateInteger: () => {
        const n = crypto.randomInt(0, 60);
        return n;
    },
};
