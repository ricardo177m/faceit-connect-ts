const { config } = require("../config/config");
const Axios = require("axios");
const { setupCache } = require("axios-cache-interceptor");
const axios = setupCache(Axios.default.create(), { ttl: config.axiosCache });

module.exports = axios;
