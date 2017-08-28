/** 
 * This file handles websocket connections from the client
 * @module controller
 * @author Paulo Henrique <pauloh@br.ibm.com>   
 */

const winston = require("../bin/logger.js"),
	voiceAPI = require("../model/voiceAPI.js"),
	conversation = require("../model/conversationAPI.js"),
	VoiceResponse = require("twilio").twiml.VoiceResponse;

function twilioHandler(request) {

	let timeout = 5;

	let hostname = "watson-voice-chat.mybluemix.net";

	return new Promise((resolve, reject) => {

		// Use the Twilio Node.js SDK to build an XML response
		const twiml = new VoiceResponse();

		//if RecordingUrl not found, then call just started
		if (!request.body.RecordingUrl) {
			winston.verbose("New conversation started");
			//new conversation, send greeting message
			twiml.play("https:// " + hostname + "/twilio/play/greeting_message.wav");

			twiml.record({
				timeout: timeout
			});


			winston.log("verbose", "Creating a new clientID for the new connected client");

			conversation.talk("", request.body.CallSid);

			// response.writeHead(200, { "Content-Type": "text/xml" });
			resolve(twiml.toString());

		}
		else {

			winston.trace("Continuing existing conversation: " + request.body.CallSid);

			voiceAPI.getAudioFromURL(request.body.RecordingUrl, request.body.CallSid)
				.then(audioBuffer => {
					return voiceAPI.speechToText(audioBuffer);
				})
				.then((text) => {
					winston.verbose("Message from client: " + text);
					return conversation.talk(text, request.body.CallSid);
				})
				.then(watsonResponse => {

					winston.debug("watsonResponse:", watsonResponse.output.text[0]);

					return voiceAPI.textToSpeech(watsonResponse.output.text[0]);
				})
				.then(result => {

					twiml.play("https://" + hostname + "/twilio/play/" + result.fileName);

					twiml.record({
						timeout: timeout
					});

					resolve(twiml.toString());
				})
				.catch(error => {
					winston.error(error);
					reject(error);
				});
		}
	});
}

module.exports = {
	twilioHandler: twilioHandler
};