/** 
 * Implements the connection to conversation APIs
 * @module conversationAPI
 * @author Paulo Henrique <pauloh@br.ibm.com>  
 */

var watsonConversation = require("./watsonConversation.js");

const winston = require("../bin/logger.js");

function talk(text, clientId, workspace_name) {

	return new Promise((resolve, reject) => {
		
		watsonConversation.talk(text, clientId, workspace_name)
			.then(response => {
				winston.trace("Response from watson conversation API: ", response);

				let newOutput = "";
				//concatenate all responses in one
				response.output.text.forEach(output => {
					newOutput += output;
				});
				response.output.text[0] = newOutput;

				resolve(response);

			}).catch(error => {
				winston.error("Error while calling watson conversation api", error);
				reject(error);
			});
	});
}

module.exports = {
	talk: talk
};