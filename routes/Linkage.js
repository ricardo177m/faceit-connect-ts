const express = require("express");
const router = express.Router();
const Linkage = require("../utils/Linkage");

router.get("/teamspeak/isOnline", async (req, res) => {
    const teamspeak = req.app.teamspeak;
    const { faceitId } = req.query;

    if (!faceitId)
        return res.status(400).json({
            message: "Invalid FACEIT id",
            success: false,
        });

    const linkage = await Linkage.getLinkageStatusByFaceitId(faceitId);
    if (!linkage)
        return res.status(400).json({
            online: false,
            success: true,
        });

    const client = await teamspeak.getClientByUid(linkage.uuid);
    if (!client)
        return res.status(200).json({
            online: false,
            success: true,
        });

    res.status(200).json({
        online: true,
        success: true,
    });
});

module.exports = router;
