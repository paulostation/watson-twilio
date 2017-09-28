var express = require("express");
var router = express.Router();
const winston = require("../bin/logger.js"),
	fs = require("fs");

/* GET home page. */
router.get("/", (req, res) => {
	res.render("index", { title: "Express" });
});

router.get("/workspaces", (req, res) => {
	let workspaces = require(req.app.locals.appRoot + "/config/workspaces.json");
	res.send(workspaces);
});

router.put("/workspaces", (req, res) => {

	let workspacesPath = req.app.locals.appRoot + "/config/workspaces.json";
	let workspaces = require(workspacesPath);

	let workspaceName = req.body.workspaceName;
	let workspaceId = req.body.workspaceId;

	workspaces[workspaceName] = workspaceId;

	fs.writeFile(workspacesPath, JSON.stringify(workspaces), "utf-8", err => {
		if (err) {
			res.status(500).send(err);
		}

		else {
			let obj = require(workspacesPath);
			res.send("Workspace added succesfully: " + JSON.stringify(obj));
		}

	});
});

router.patch("/workspaces", (req, res) => {

	let workspacesPath = req.app.locals.appRoot + "/config/workspaces.json";
	let workspaces = require(workspacesPath);

	let workspaceName = req.body.workspaceName;
	let workspaceId = req.body.workspaceId;

	workspaces[workspaceName] = workspaceId;

	var util = require("util");

	fs.writeFile(workspacesPath, util.inspect(workspaces), "utf-8", err => {
		if (err) {
			res.status(500).send(err);
		}

		else {
			let obj = require(workspacesPath);
			res.send("Workspace added succesfully: " + JSON.stringify(obj));
		}

	});
});

router.delete("/workspaces", (req, res) => {

	let workspacesPath = req.app.locals.appRoot + "/config/workspaces.json";
	let workspaces = require(workspacesPath);

	let workspaceName = req.body.workspaceName;
	let workspaceId = req.body.workspaceId;

	workspaces[workspaceName] = workspaceId;

	var util = require("util");

	fs.writeFile(workspacesPath, util.inspect(workspaces), "utf-8", err => {
		if (err) {
			res.status(500).send(err);
		}

		else {
			let obj = require(workspacesPath);
			res.send("Workspace added succesfully: " + JSON.stringify(obj));
		}

	});
});

module.exports = router;
