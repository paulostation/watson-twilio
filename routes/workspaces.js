var express = require("express");
var router = express.Router();
const winston = require("../bin/logger.js"),

	fs = require("fs");

let workspacesPath = require("app-root-path") + "/config/workspaces.json";

router.get("/", (req, res) => {

	res.send(require(workspacesPath));

});

router.put("/", (req, res) => {

	let workspaces = require(workspacesPath);

	let workspaceName = req.body.workspaceName;
	let workspaceId = req.body.workspaceId;

	if (workspaces[workspaceName]) {

		res.status(400).send("There isn't an already existing " + workspaceName + "workspace. To update, use PATCH method instead");
	} else {

		workspaces[workspaceName] = workspaceId;

		let newWorkspaces = JSON.stringify(workspaces);

		fs.writeFile(workspacesPath, newWorkspaces, "utf-8", err => {

			if (err) {
				res.status(500).send(err);
			} else {
				
				res.send("Workspace added succesfully: " + newWorkspaces);
			}
		});

	}
});

router.patch("/", (req, res) => {

	let workspaces = require(workspacesPath);

	let workspaceName = req.body.workspaceName;
	let workspaceId = req.body.workspaceId;

	if (!workspaces[workspaceName]) {

		res.status(400).send("There isn't an already existing " + workspaceName + " workspace. Use PUT method instead");

	} else {
		workspaces[workspaceName] = workspaceId;

		let newWorkspaces = JSON.stringify(workspaces);

		fs.writeFile(workspacesPath, newWorkspaces, "utf-8", err => {

			if (err) {
				res.status(500).send(err);
			} else {
				
				res.send("Workspace added succesfully: " + newWorkspaces);
			}
		});
	}
});

router.delete("/", (req, res) => {

	let workspaces = require(workspacesPath);

	let workspaceName = req.body.workspaceName;	

	if (!workspaces[workspaceName]) {

		res.send("There isn't an already existing " + workspaceName + " workspace. Nothing to delete");

	} else {

		delete workspaces[workspaceName];

		let newWorkspaces = JSON.stringify(workspaces);

		fs.writeFile(workspacesPath,newWorkspaces, "utf-8", err => {

			if (err) {
				res.status(500).send(err);
			} else {
				
				res.send("Workspace deleted succesfully: " + newWorkspaces);
			}
		});
	}
});

module.exports = router;
