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

	let timeout = 3;

	return new Promise((resolve, reject) => {

		// Use the Twilio Node.js SDK to build an XML response
		const twiml = new VoiceResponse();

		//if RecordingUrl not found, then call just started
		if (!request.body.RecordingUrl) {
			winston.verbose("New conversation started");
			//new conversation, send greeting message
			twiml.play("https://185bf826.ngrok.io/twilio/play/greeting_message.wav");

			twiml.record({
				timeout: timeout
			});


			winston.log("verbose", "Creating a new clientID for the new connected client");

			conversation.talk("", request.body.CallSid);

			// response.writeHead(200, { "Content-Type": "text/xml" });
			resolve(twiml.toString());

		}
		else {

			winston.verbose("Continuing existing conversation: " + request.body.CallSid);

			voiceAPI.getAudioFromURL(request.body.RecordingUrl, request.body.CallSid)
				.then(audioBuffer => {
					return voiceAPI.speechToText(audioBuffer);
				})
				.then((text) => {
					winston.verbose("Message from client: " + text);
					return conversation.talk(text, request.body.CallSid);
				})
				.then(watsonResponse => {

					// elapsedTime = new Date().getTime() - stopWatch;
					winston.verbose("watsonResponse:", watsonResponse.output.text[0]);
					// winston.verbose("Generated in ", elapsedTime, "ms\n");

					// stopWatch = new Date().getTime();

					return voiceAPI.textToSpeech(watsonResponse.output.text[0]);
				})
				.then(result => {

					twiml.play("https://185bf826.ngrok.io/twilio/play/" + result.fileName);

					twiml.record({
						timeout: timeout
					});

					// response.writeHead(200, { "Content-Type": "text/xml" });
					resolve(twiml.toString());
				})
				.catch(error => {
					winston.error(error);
					reject(error);
				});
		}
	});
}
/*
binaryServer.on("connection", function (client) {

	winston.debug("new connection");

	//when client connects, send him the greeting message from voice API
	client.send(voiceAPI.greetingMessage);

	if (!client._id) {
		winston.log("verbose", "Creating a new clientID for the new connected client");
		client._id = guid();
		conversation.talk("", client._id);
	}

	client.on("stream", function (stream) {
		winston.debug("new stream");

		let absolutePath = path.join(__dirname, "../audio/audio_client.raw");

		stream.pipe(fs.createWriteStream(absolutePath));

		let buffers = [];

		stream.on("data", data => {
			buffers.push(data);
		});

		stream.on("end", () => {

			winston.debug("stream ended");

			winston.debug("file written");
			// fileWriter.end();
			var stopWatch = new Date().getTime();
			var start = stopWatch;
			let elapsedTime;

			converter.resampleTo8KHz(absolutePath)
				.then(audioFilePath => {

					elapsedTime = new Date().getTime() - stopWatch;
					winston.verbose("Audio file converted in", elapsedTime, "ms");
					stopWatch = new Date().getTime();
					return voiceAPI.speechToText(audioFilePath);
				})
				.then(userInput => {

					elapsedTime = new Date().getTime() - stopWatch;

					winston.verbose("Parsed speech to text in", elapsedTime, "ms");
					winston.verbose("User input: ", userInput);
					stopWatch = new Date().getTime();

					return conversation.talk(userInput, this._id);
				})
				.then(watsonResponse => {

					elapsedTime = new Date().getTime() - stopWatch;
					winston.verbose("watsonResponse:", watsonResponse.output.text[0]);
					winston.verbose("Generated in ", elapsedTime, "ms\n");

					stopWatch = new Date().getTime();

					return voiceAPI.textToSpeech(watsonResponse.output.text[0]);
				})
				.then(audioFile => {

					elapsedTime = new Date().getTime() - stopWatch;
					let totalElapsedTime = new Date().getTime() - start;

					winston.verbose("Speech generated in", elapsedTime, "ms");
					winston.verbose("totalElapsedTime:", totalElapsedTime, "ms");

					client.send(audioFile);
				})
				.catch(error => {
					winston.error(error);
				});
		});
	});

	client.on("close", function () {
		winston.info("Client disconnected");
	});

});
*/
module.exports = {
	twilioHandler: twilioHandler
};