require("dotenv").config();
const express = require("express");
const http = require("http");
const helmet = require("helmet");
const cors = require("cors");
const { port } = require("./config/config");
const app = express();
const httpServer = http.createServer(app);
const colors = require("@colors/colors/safe");
const DoChecks = require("./utils/DoChecks");
const teamspeak = require("./teamspeak")(app);
const edge = require("./edge")(app);

// app specific
app.data = {};

// middlewares
const { corsOptions } = require("./middlewares/corsOptions");
const validatePayload = require("./middlewares/validatePayload");
const fallErrors = require("./middlewares/fallErrors");

app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(cors(corsOptions()));
app.use(validatePayload);

DoChecks()
    .then(() => app.emit("ready"))
    .catch(() => {
        console.log(
            `\n${colors.red("[!]")} Some checks have not passed, stopping.\n`
        );
        teamspeak.quit();
        edge.close();
        process.exit(-1);
    });

// routes
// const BASE = "";
app.use("/", require("./routes/Oauth"));

app.use('/success', express.static('public/success.html'))

// fall errors
app.use((req, res, next) => {
    const error = new Error("Not found");
    error.status = 404;
    next(error);
});
app.use(fallErrors);

app.on("ready", () => {
    httpServer.listen(port, () => {
        console.log(`${colors.green("[✔]")} Server listening on port ${port}!`);
    });
});
