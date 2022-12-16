module.exports = {
    /**
     * Returns an object containing the ip, country code and user agent
     * using cloudflare headers, if available
     *  {
     *      ip: ...,
     *      country: ...,
     *      useragent: ...
     *  }
     *
     * @param {*} headers headers from request
     *
     * @returns {*} object
     */
    getClientInfoWithCF: (req) => {
        const cfInfo = {
            ip:
                "cf-connecting-ip" in req.headers
                    ? req.headers["cf-connecting-ip"]
                    : req.headers["x-forwarded-for"] ||
                      req.socket.remoteAddress,
            country:
                "cf-ipcountry" in req.headers
                    ? req.headers["cf-ipcountry"]
                    : null,
            useragent: req.get("user-agent") || null,
        };

        return cfInfo;
    },
};
