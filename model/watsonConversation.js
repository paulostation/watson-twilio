/** 
 * Implements the connection to Watson Conversation
 * @module watsonConversationController
 * @author Paulo Henrique <pauloh@br.ibm.com>   
 */

const ConversationV1 = require("watson-developer-cloud/conversation/v1"),
	config = require("../config/watsonService.json"),
	winston = require("../bin/logger.js");

//array where the 
let clientContextArray = {};

// Set up Conversation service wrapper.
const conversation = new ConversationV1({
	username: config.username,
	password: config.password,
	version_date: config.version_date
});

let workspaces = config.workspaces;

function talk(text, clientId, workspace_name) {

	let workspace_id = workspaces[workspace_name];

	return new Promise((resolve, reject) => {
		//If user input is empty, start a new conversation and store it in the client context array
		if ("" === text) {
			conversation.message({
				input: {
					text: text
				},
				workspace_id: workspace_id
			}, (err, response) => {

				if (err) {
					reject(err);
				} else if (response.context) {

					clientContextArray[clientId] = response.context;
					resolve(response);
				} else {
					reject("Empty context from watson conversation");
				}
			});
		}
		//If there's user input, continue normally	
		else {

			conversation.message({
				input: {
					text: text
				},
				context: clientContextArray[clientId],
				workspace_id: workspace_id
			}, (err, response) => {

				if (err) {
					reject(err);
				}

				// Display the output from dialog, if any.
				if (response.output.text.length != 0) {
					clientContextArray[clientId] = response.context;
					winston.debug(response);
					resolve(response);

				} else {
					reject("Empty response from watson conversation");
				}
			});
		}
	});
}



module.exports = {
	talk: talk
};