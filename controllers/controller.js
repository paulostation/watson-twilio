/** 
 * This file handles websocket connections from the client
 * @module controller
 * @author Paulo Henrique <pauloh@br.ibm.com>   
 */

const winston = require("../bin/logger.js"),
	voiceAPI = require("../model/voiceAPI.js"),
	conversation = require("../model/conversationAPI.js"),
	VoiceResponse = require("twilio").twiml.VoiceResponse;

<<<<<<< HEAD

//Used to generate uids for clients
function guid() {
	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000)
			.toString(16)
			.substring(1);
	}
	return s4() + s4() + "-" + s4() + "-" + s4() + "-" +
		s4() + "-" + s4() + s4() + s4();
}

function speechRecognitionUsingCPqD(request) {
=======
function twilioHandler(request) {
>>>>>>> dev

	let timeout = 5;

	let hostname = "watson-voice-chat.mybluemix.net";

	return new Promise((resolve, reject) => {

		// Use the Twilio Node.js SDK to build an XML response
		const twiml = new VoiceResponse();

		console.log(request.body);

		//if RecordingUrl not found, then call just started
		if (!request.body.RecordingUrl) {

			winston.verbose("New conversation started");
<<<<<<< HEAD

			//new conversation, send greeting message			
			twiml.play("https://185bf826.ngrok.io/twilio/play/greeting_message.wav");
=======
			//new conversation, send greeting message
			twiml.play("https:// " + hostname + "/twilio/play/greeting_message.wav");
>>>>>>> dev

			twiml.record({
				timeout: timeout

<<<<<<< HEAD
=======
			});

>>>>>>> dev
			winston.log("verbose", "Creating a new clientID for the new connected client");

			conversation.talk("", request.body.CallSid);

			resolve(twiml.toString());

		} else {

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

<<<<<<< HEAD
					// elapsedTime = new Date().getTime() - stopWatch;
					winston.verbose("watsonResponse:", watsonResponse.output.text[0]);

					twiml.say({
						voice: "woman",
						language: "pt-BR"
					}, watsonResponse.output.text[0]);

					resolve(twiml.toString());
				})
=======
					winston.debug("watsonResponse:", watsonResponse.output.text[0]);

					twiml.say({
						voice: 'woman',
						language: "pt-BR"
					},"teste de voz");

					resolve(twiml.toString());

					// return voiceAPI.textToSpeech(watsonResponse.output.text[0]);
				})
				// .then(result => {

					// twiml.play("https://" + hostname + "/twilio/play/" + result.fileName);

					
				// })
>>>>>>> dev
				.catch(error => {
					winston.error(error);
					reject(error);
				});
		}
	});
}
<<<<<<< HEAD

function speechRecognitionUsingTwilio(request) {

	let timeout = 3;

	return new Promise((resolve, reject) => {

		// Use the Twilio Node.js SDK to build an XML response
		const twiml = new VoiceResponse();

		//if SpeechResult not found, then call just started
		if (!request.body.SpeechResult) {
			winston.verbose("New conversation started");

			winston.log("verbose", "Creating a new clientID for the new connected client");

			conversation.talk("", request.body.CallSid);


			const VoiceResponse = require("twilio").twiml.VoiceResponse;

			const response = new VoiceResponse();
			const gather = response.gather({
				input: "speech",
				timeout: 5,
				speechTimeout: 1,
				numDigits: 1,
				language: "pt-BR"
			});

			//new conversation, send greeting message
			gather.say({
				language: "pt-BR",
				voice: "man"
			}, "Olá, sou o Watson, seu assistente cognitivo. Como posso te ajudar?");

			resolve(response.toString());

		}
		else {
			winston.verbose("Continuing existing conversation: " + request.body.CallSid);

			if (request.body.SpeechResult) {
				conversation.talk(request.body.SpeechResult, request.body.CallSid)
					.then(watsonResponse => {

						// elapsedTime = new Date().getTime() - stopWatch;
						winston.verbose("watsonResponse:", watsonResponse.output.text[0]);
						const response = new VoiceResponse();

						const gather = response.gather({
							input: "speech",
							timeout: 5,
							speechTimeout: 1,
							numDigits: 1,
							language: "pt-BR"
						});

						gather.say({
							voice: "man",
							language: "pt-BR"
						}, watsonResponse.output.text[0]);

						resolve(response.toString());
					})
					.catch(error => {
						reject(error);
					});
			}


		}
	});
}
=======
>>>>>>> dev

module.exports = {
	twilioHandler: speechRecognitionUsingTwilio
};