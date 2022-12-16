const express = require("express");
const router = express.Router();
const axios = require("axios");
const validator = require("validator").default;
const { config } = require("../config/config");
const tools = require("../utils/tools");
const dbpool = require("../services/db");

router.get("/oauth/redirect", async (req, res) => {
    const clientid = process.env.FACEIT_CLIENTID;
    const clientsecret = process.env.FACEIT_CLIENTSECRET;
    const code = req.query.code;
    const credentials = Buffer.from(
        `${clientid}:${clientsecret}`,
        "utf8"
    ).toString("base64");

    getFaceitTokenEndpoint()
        .then((token_endpoint) => {
            axios({
                method: "post",
                url: `${token_endpoint}?code=${code}&grant_type=authorization_code`,
                headers: {
                    accept: "application/json",
                    Authorization: `Basic ${credentials}`,
                },
            })
                .then((response) => {
                    const accessToken = response.data.access_token;
                    axios({
                        method: "get",
                        url: config.faceitEndpoints.oauthUserInfo,
                        headers: {
                            accept: "application/json",
                            Authorization: "Bearer " + accessToken,
                        },
                    }).then(async (res2) => {
                        if (
                            req.query.state !== undefined &&
                            validator.isUUID(req.query.state)
                        ) {
                            /**
                             *  verificar se utilizador já está na tabela users
                             *  se não estiver, adicionar
                             *  se estiver, atualizar nickname na tabela users caso necessário
                             *  adicionar a sessão
                             */

                            const query = `SELECT * FROM users WHERE playerid = ?`;
                            const params = [res2.data.guid];
                            const [select_res] = await dbpool.execute(
                                query,
                                params
                            );

                            var uid;

                            if (!select_res.length) {
                                // adicionar utilizador à tabela users
                                const query2 = `INSERT INTO users (playerid,nickname) VALUES (?,?)`;
                                const params2 = [
                                    res2.data.guid,
                                    res2.data.nickname,
                                ];
                                const [insert_res] = await dbpool.execute(
                                    query2,
                                    params2
                                );

                                if (!insert_res.affectedRows) {
                                    res.status(500).json({
                                        message: "Internal server error",
                                        success: false,
                                    });
                                    return;
                                }

                                uid = insert_res.insertId;
                            } else {
                                const userData = select_res[0];
                                uid = userData["id"];
                            }

                            try {
                                // adicionar à tabela sessions
                                const clientInfo =
                                    tools.getClientInfoWithCF(req);

                                const query2 = `INSERT INTO sessions (login_id,userid,ip,country) VALUES (?,?,?,?)`;
                                const params2 = [
                                    req.query.state,
                                    uid,
                                    clientInfo.ip,
                                    clientInfo.country,
                                ];
                                const [insert_res] = await dbpool.execute(
                                    query2,
                                    params2
                                );

                                if (!insert_res.affectedRows) {
                                    res.status(500).json({
                                        message: "Internal server error",
                                        success: false,
                                    });
                                    return;
                                }

                                // atualizar last_login e nickname (caso seja alterado)
                                const query3 = `UPDATE users SET nickname = ?, last_login = NOW() WHERE id = ?`;
                                const params3 = [res2.data.nickname, uid];
                                await dbpool.execute(query3, params3);

                                // redirect
                                res.redirect(process.env.APP_URL);
                            } catch (error) {
                                return res.status(400).json({
                                    message: "Bad request",
                                    success: false,
                                });
                            }
                        } else {
                            return res.status(400).json({
                                message: "Bad request",
                                success: false,
                            });
                        }
                    });
                })
                .catch((err) => {
                    console.error(err.response.data);
                    res.status(500).json({
                        message: "Internal server error",
                        success: false,
                    });
                });
        })
        .catch((err) => {
            console.error(err.response.data);
            res.status(500).json({
                message: "Internal server error",
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
