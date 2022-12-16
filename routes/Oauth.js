const express = require("express");
const router = express.Router();
const axios = require("axios");
const validator = require("validator").default;
const { config } = require("../config/config");
const tools = require("../utils/tools");
const dbpool = require("../services/db");

router.get("/link", async (req, res) => {
    const clientid = process.env.FACEIT_CLIENTID;
    const token = req.query.token;
    if (token === null || token === undefined) {
        res.status(400).json({
            msg: "Undefined token",
            error: true,
        });
        return;
    }
    const url = `${config.faceitEndpoints.accounts}?response_type=code&client_id=${clientid}&redirect_popup=true&state=${token}`;
    res.redirect(url);
});

router.get("/oauth/redirect", async (req, res) => {
    const clientid = process.env.FACEIT_CLIENTID;
    const clientsecret = process.env.FACEIT_CLIENTSECRET;
    const code = req.query.code;
    const credentials = Buffer.from(`${clientid}:${clientsecret}`, "utf8").toString("base64");

    getFaceitTokenEndpoint()
        .then((tokenEndpoint) => {
            axios({
                method: "post",
                url: `${tokenEndpoint}?code=${code}&grant_type=authorization_code`,
                headers: {
                    accept: "application/json",
                    Authorization: `Basic ${credentials}`,
                },
            })
                .then((tokenEndpointResponse) => {
                    const accessToken = tokenEndpointResponse.data.access_token;
                    axios({
                        method: "get",
                        url: config.faceitEndpoints.oauthUserInfo,
                        headers: {
                            accept: "application/json",
                            Authorization: "Bearer " + accessToken,
                        },
                    }).then(async (userInfoResponse) => {
                        console.log(userInfoResponse);
                        // check token
                        if (req.query.state !== undefined) {
                            let query = `SELECT * FROM link WHERE token = ?`;
                            let params = [req.query.state];
                            const [select_res] = await dbpool.execute(query, params);

                            if (!select_res.length) {
                                return res.status(400).json({
                                    message: "Invalid token",
                                    success: false,
                                });
                            }

                            query = "UPDATE link set token = null, faceit_id = ?, nickname = ?, linked_at = CURRENT_TIMESTAMP() WHERE token = ?";
                            params = [userInfoResponse.data.guid, userInfoResponse.data.nickname, req.query.state];
                            const [update_res] = await dbpool.execute(query, params);

                            if (!update_res.affectedRows) {
                                return res.status(500).json({
                                    message: "Internal server error",
                                    success: false,
                                });
                            }

                            res.redirect("/success");
                        }
                    });
                })
                .catch((err) => {
                    // check if error is from axios
                    if (err.response) {
                        if (err.response.data.error == "invalid_grant")
                            return res.status(401).json({
                                message: "Invalid token, please try to login again",
                                success: false,
                            });
                        console.error(err.response.data);
                        console.error(err.response.status);
                    } else console.error(err);
                    res.status(500).json({
                        message: "Internal server error",
                        success: false,
                    });
                });
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json({
                message: "Internal server error1",
                success: false,
            });
        });
});

router.post("/logout", async (req, res) => {
    let user = await tools.checkUser(req.headers, res);
    if (user === -1) return;

    if (user !== null) {
        try {
            const login_id = req.headers.authorization.split(" ")[1];

            const query = ` UPDATE sessions
                            SET state = 0
                            WHERE login_id = ? AND state = 1`;
            const params = [login_id];
            const [update_res] = await dbpool.execute(query, params);

            if (!update_res.affectedRows) {
                return res.status(500).json({
                    message: "Internal server error",
                    success: false,
                });
            }
        } catch (error) {
            console.log(error);
            res.status(500).json({
                message: "Internal server error",
                success: false,
            });
            return;
        }
    }

    res.status(200).json({
        message: "Ok",
        success: true,
    });
});

function getFaceitTokenEndpoint() {
    return new Promise((resolve, reject) => {
        axios({
            method: "get",
            url: config.faceitEndpoints.openidConfig,
        })
            .then((response) => resolve(response.data.token_endpoint))
            .catch((error) => reject(error));
    });
}

module.exports = router;
