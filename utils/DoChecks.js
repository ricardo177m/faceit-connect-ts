const colors = require("@colors/colors/safe");
const fs = require("fs");
const {
    requiredEnvVars,
    requiredTables,
    requiredSettings,
} = require("../config/checksRequirements");
const db = require("../services/db");
const Settings = require("../utils/Settings");

function CheckDb() {
    return new Promise(async (resolve, reject) => {
        console.log(`\n${colors.cyan("[i]")} Execute checks`);

        // check env vars
        console.log(`   ${colors.yellow("1.")} Checking env vars...`);

        let flag = false;
        for (let i = 0; i < requiredEnvVars.length; i++) {
            const env = requiredEnvVars[i];
            if (process.env[env] === undefined) {
                console.log(
                    `   ${colors.red("[X]")} Env var ${colors.bold(
                        env
                    )} not defined.`
                );
                flag = true;
            }
        }
        if (flag) return reject();

        const dbName = process.env.DB_NAME.replace(";", "");

        // check db
        console.log(`   ${colors.yellow("2.")} Checking database...`);
        flag = false;
        try {
            const [databaseCheck] = await db.execute(
                `   SELECT SCHEMA_NAME as db
                    FROM INFORMATION_SCHEMA.SCHEMATA
                    WHERE SCHEMA_NAME = ?`,
                [process.env.DB_NAME]
            );
            if (!databaseCheck.length) flag = true;
        } catch (error) {
            if (error.code === "ER_BAD_DB_ERROR") {
                flag = true;
            } else {
                console.log(
                    `   ${colors.red("[X]")} Error: ${
                        error.message ?? error.sqlMessage
                    }`
                );
                return reject();
            }
        }

        if (flag) {
            console.log(
                `   ${colors.cyan(
                    "[i]"
                )} Database does not exist. Creating database...`
            );

            const createDb = require("../services/noDbConfig");
            const createDbQuery = `CREATE DATABASE IF NOT EXISTS ${dbName} DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`;
            try {
                await createDb.execute(createDbQuery);
            } catch (error) {
                console.log(
                    `   ${colors.red("[X]")} Could not create database. ${
                        error.message ?? error.sqlMessage
                    }`
                );
                return reject();
            }
        }

        // check tables
        console.log(`   ${colors.yellow("3.")} Checking tables...`);
        flag = false;
        try {
            const [tablesCheck] = await db.execute(
                `   SELECT TABLE_NAME name
                    FROM INFORMATION_SCHEMA.TABLES
                    WHERE table_schema = ?`,
                [process.env.DB_NAME]
            );

            // note to self: if a new table was added, please add its structure
            // to db.sql file and add it to requiredTables in checksRequirements.js
            let i = 0;
            for (const table of tablesCheck) {
                const tableName = table["name"];
                if (
                    requiredTables.findIndex((elem) => elem === tableName) ===
                    -1
                )
                    flag = true;
                i++;
            }
            if (requiredTables.length !== i) flag = true;

            if (flag) {
                if (tablesCheck.length !== 0) {
                    console.log(
                        `   ${colors.cyan(
                            "[i]"
                        )} Some tables could not be found. Executing query to create them...`
                    );
                } else {
                    console.log(
                        `   ${colors.cyan(
                            "[i]"
                        )} Database is empty. Installing database...`
                    );
                }
                await installDb().catch((error) => {
                    console.log(
                        `   ${colors.red("[X]")} Error: ${
                            error.message ?? error.sqlMessage
                        }`
                    );
                    return reject();
                });
            }
        } catch (error) {
            console.log(
                `   ${colors.red("[X]")} Error: ${
                    error.message ?? error.sqlMessage
                }`
            );
            return reject();
        }

        // check settings table
        // console.log(`   ${colors.yellow("4.")} Checking settings...`);
        // flag = false;
        // try {
        //     const settings = await Settings.getAll();
        //     const settingsLength = Object.keys(settings).length;
        //     let i = 0;
        //     for (; i < settingsLength; i++) {
        //         if (settings[requiredSettings[i]] === undefined) flag = true;
        //     }
        //     if (i !== settingsLength) flag = true;
        // } catch (error) {
        //     console.log(`   ${colors.red("[X]")} Error: ${error.message}`);
        //     return reject();
        // }

        // if (flag) {
        //     console.log(`   ${colors.red("[X]")} Some settings are missing.`);
        //     return reject();
        // }

        console.log(`\n${colors.green("[✔]")} All checks passed!`);
        resolve();
    });
}

function installDb() {
    return new Promise((resolve, reject) => {
        const filename = __dirname + "/../config/db.sql";

        const sqlFile = fs.readFileSync(filename).toString().split(";");
        for (const sql of sqlFile) {
            db.execute(sql)
                .then(() => resolve())
                .catch((error) => {
                    reject({
                        message: `Could not install database. ${
                            error.message ?? error.sqlMessage
                        }`,
                    });
                });
        }
    });
}

module.exports = CheckDb;
