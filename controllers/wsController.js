/** 
 * This file handles websocket connections from the client
 * @module wsController
 * @author Paulo Henrique <pauloh@br.ibm.com>   
 */

const winston = require("../bin/logger.js"),
	voiceAPI = require("../model/voiceAPI.js"),
	path = require("path"),
	fs = require("fs"),
	{ guid } = require("../util/util.js"),
	ASRClient = require("../model/ASRClient.js"),
	conversation = require("../model/conversationAPI.js");

let { binaryServer } = require("../bin/webServer");


// let asrClient = new ASRClient("ws://9.18.180.254:8025/asr-server/asr");

// asrClient.connect();

// asrClient.on("connected", () => {

// 	asrClient.createSession();
// });

// asrClient.on("ready", () => {

// });

// asrClient.on("error", error => {
// 	winston.error("ASR Client error:");
// 	winston.error(error);
// });

binaryServer.on("connection", function (client) {

	winston.verbose("New client connected");

	client.ASRClient = new ASRClient("ws://9.18.180.254:8025/asr-server/asr");

	client.ASRClient.connect();

	client.ASRClient.on("connected", () => {

		client.ASRClient.createSession();
	});

	client.ASRClient.on("error", error => {
		winston.error("ASR Client error:");
		winston.error(error);
	});

	client.ASRClient.on("ready", () => {

		if (!client._id) {
			winston.log("verbose", "Creating a new clientID for the new connected client");
			client._id = guid();
			conversation.talk("", client._id)
		}

		//when client connects, send him the greeting message from voice API
		client.send(voiceAPI.greetingMessage);

	});



	winston.silly("Ready to listen for client connections");

	client.on("stream", function (stream, meta) {

		winston.verbose("client stream started");

		let absolutePath = path.join(__dirname, "../audio/audio_client.raw");

		stream.pipe(fs.createWriteStream(absolutePath));


		stream.on("data", audioChunk => {

			client.ASRClient.sendAudio(audioChunk);

		});

		stream.on("end", () => {

			winston.verbose("stream ended");

			// winston.info("file written");
			// fileWriter.end();
			var stopWatch = new Date().getTime();
			var start = stopWatch;
			let elapsedTime;

			// converter.resampleTo8KHz(absolutePath)
			// .then(audioFilePath => {

			// elapsedTime = new Date().getTime() - stopWatch;
			// console.log("Audio file converted in", elapsedTime, "ms");
			// stopWatch = new Date().getTime();
			// return voiceAPI.speechToText(audioFilePath);
			// })
			// voiceAPI.speechToText(Buffer.concat(buffers))
			// 	.then(userInput => {

			// 		elapsedTime = new Date().getTime() - stopWatch;
			// 		console.log();
			// 		console.log("Parsed speech to text in", elapsedTime, "ms");
			// 		console.log("User input: ", userInput);
			// 		stopWatch = new Date().getTime();

			// 		return conversation.talk(userInput, this._id);
			// 	})
			// 	.then(watsonResponse => {

			// 		context = watsonResponse.context;
			// 		elapsedTime = new Date().getTime() - stopWatch;
			// 		console.log("watsonResponse:", watsonResponse.output.text[0]);
			// 		console.log("Watson query ran in ", elapsedTime, "ms\n");

			// 		stopWatch = new Date().getTime();

			// 		return voiceAPI.textToSpeech(watsonResponse.output.text[0]);
			// 	})
			// 	.then(audioFile => {

			// 		elapsedTime = new Date().getTime() - stopWatch;
			// 		let totalElapsedTime = new Date().getTime() - start;

			// 		console.log("Speech generated in", elapsedTime, "ms");

			// 		console.log();
			// 		console.log();
			// 		console.log("totalElapsedTime:", totalElapsedTime, "ms");
			// 		console.log();
			// client.send(audioFile.audioBuffer);
			// 		winston.verbose("Stream sent to the client");
			// 	})
			// 	.catch(error => {
			// 		console.log(error);
			// 	});

		});
	});





	client.on("close", function () {
		winston.verbose("Client disconnected");
	});

});