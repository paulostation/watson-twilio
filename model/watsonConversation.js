/** 
 * Implements the connection to Watson Conversation
 * @module watsonConversationController
 * @author Paulo Henrique <pauloh@br.ibm.com>   
 */

const ConversationV1 = require("watson-developer-cloud/conversation/v1"),
	winston = require("../bin/logger.js");


let clientContextArray = {};

// Set up Conversation service wrapper.
const conversation = new ConversationV1({
	username: "8b4bae75-b2f7-4aea-95c6-1df6de847f1c", // replace with username from service key
	password: "eTCTE34Y6TG5", // replace with password from service key
	path: { workspace_id: "974658f1-1649-4a52-92d5-4253313cc800" }, // replace with workspace ID
	version_date: "2016-07-11"
});

function talk(text, clientId) {

	return new Promise((resolve, reject) => {
		//If user input is empty, start a new conversation and store it in the client context array
		if ("" === text) {
			conversation.message({
				input: {
					text: text
				}
			},
			(err, response) => {

				if (err) {
					reject(err);
				}

				if (response.context) {

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
				context: clientContextArray[clientId]
			},
			(err, response) => {

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