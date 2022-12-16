const express = require("express");

module.exports = express.json({
  verify: (req, res, buf, encoding) => {
    try {
      if (buf !== undefined) JSON.parse(buf);
    } catch (e) {
      const error = new Error("Invalid JSON payload");
      error.status = 400;
      throw error;
    }
  },
});
