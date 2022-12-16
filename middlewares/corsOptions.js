function corsOptions() {
    const corsOptions = {
        origin: check,
    };

    return corsOptions;
}

function ioCors() {
    const corsOptions = {
        origin: check,
    };

    return corsOptions;
}

function check(origin, callback) {
    const whitelist = JSON.parse(process.env.ALLOWED_DOMAINS);
    let isOriginWhitelisted = whitelist.indexOf(origin) !== -1;
    callback(
        !origin || isOriginWhitelisted ? null : "Bad request",
        isOriginWhitelisted
    );
}

module.exports = { corsOptions, ioCors };
