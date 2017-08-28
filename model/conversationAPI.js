/** 
 * Implements the connection to conversation APIs
 * @module conversationAPI
 * @author Paulo Henrique <pauloh@br.ibm.com>  
 */

var watsonConversation = require("./watsonConversation.js");

const winston = require("../bin/logger.js");

function talk(text, clientId) {

	return new Promise((resolve, reject) => {

		watsonConversation.talk(text, clientId)
			.then(response => {
				winston.trace("Response from watson conversation API: ", response);
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