var express = require("express");
var router = express.Router();
const winston = require("../bin/logger.js"),
	workspaces = require("./workspaces");
	fs = require("fs");

router.use("/workspaces",workspaces);

module.exports = router;
