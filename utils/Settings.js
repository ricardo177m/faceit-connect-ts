const db = require("../services/db");

function getAll() {
    return new Promise((resolve, reject) => {
        db.execute("SELECT * FROM settings")
            .then(([data]) => {
                let settings = {};
                data.forEach((e) => {
                    settings[e["name"]] = e["value"];
                });
                resolve(settings);
            })
            .catch((error) => {
                reject({ message: error.message ?? error.sqlMessage });
            });
    });
}

module.exports = { getAll };
