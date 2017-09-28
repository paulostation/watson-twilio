/** 
 * This file handles HTTP REST connections from the client
 * @module controller
 * @author Paulo Henrique <pauloh@br.ibm.com>   
 */

const winston = require("../bin/logger.js"),
	
	conversation = require("../services/conversationAPI.js");


function speechRecognitionUsingTwilio(request) {

	let speechStartTimeout = 3;
	let speechEndTimeout = 1;
	let workspace_name = request.params.workspace_name;

	return new Promise((resolve, reject) => {

		// Use the Twilio Node.js SDK to build an XML response
		const VoiceResponse = require("twilio").twiml.VoiceResponse;

		//if SpeechResult not found, then call just started
		if (!request.body.SpeechResult) {

			winston.verbose("New conversation started");

			winston.log("verbose", "Creating a new clientID for the new connected client");

			conversation.talk("", request.body.CallSid, workspace_name)
				.then(watsonResponse => {
					const response = new VoiceResponse();
					const gather = response.gather({
						input: "speech",
						timeout: speechStartTimeout,
						speechTimeout: speechEndTimeout,
						language: "pt-BR"
					});

					//new conversation, send greeting message
					gather.say({
						language: "pt-BR",
						voice: "man"
					}, watsonResponse.output.text[0]);

					winston.verbose("Greeting message: ", watsonResponse.output.text[0]);

					resolve(response.toString());
				})
				.catch(error => {
					winston.error(error);
					reject(error);
				});
		} else {

			winston.trace("Continuing existing conversation: " + request.body.CallSid);
			winston.verbose("Message from client: ", request.body.SpeechResult);

			conversation.talk(request.body.SpeechResult, request.body.CallSid, workspace_name)
				.then(watsonResponse => {

					winston.verbose("watsonResponse:", watsonResponse.output.text[0]);
					const response = new VoiceResponse();

					if (watsonResponse.context.encerramento) {

						winston.silly("Reached conversation finishing node. Telling twilio to finish conversation.");

						response.say(
							{
								voice: "woman",
								language: "pt-BR",
							},
							watsonResponse.output.text[0]
						);

						winston.verbose("Conversation finished");

					}

					else if (watsonResponse.context.redirect) {

						const dial = response.dial();
						dial.number(watsonResponse.context.redirect);

						response.say(
							{
								voice: "woman",
								language: "pt-BR",
							},
							watsonResponse.output.text[0]
						);

						console.log(watsonResponse.context.redirect);
					}
					else {

						winston.silly("Not a conversation finishing node.");

						const gather = response.gather({
							input: "speech",
							timeout: speechStartTimeout,
							speechTimeout: speechEndTimeout,
							language: "pt-BR"
						});

						gather.say({
							voice: "woman",
							language: "pt-BR"
						}, watsonResponse.output.text[0]);
					}

					resolve(response.toString());
				})
				.catch(error => {
					reject(error);
				});
		}
	});
}

module.exports = {
	twilioHandler: speechRecognitionUsingTwilio
};