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

// let wsClient = new ASRClient("ws://9.18.180.254:8025/asr-server/asr");

// wsClient.connect();

// wsClient.on("connected", () => {
// 	console.log("Connected");
// });

// wsClient.on("ready", () => {
// 	fs.readFile(path.join(__dirname, "../audio/greeting_message.wav"), (err, data) => {
// 		if(err) console.error(err);
// 		else {
// 			wsClient.sendAudio(data);
// 		}
// 	});
// 	console.log("my body is ready");
// });

binaryServer.on("connection", function (client) {

	let context;

	winston.verbose("New client connected");

	client.ASRClient = new ASRClient("ws://9.18.180.254:8025/asr-server/asr");

	client.ASRClient.connect();

	client.ASRClient.on("error", error => {
		winston.error("ASR Client error:");
		winston.error(error);
	});

	client.ASRClient.on("ready", () => {

		if (!client._id) {
			winston.log("verbose", "Creating a new clientID for the new connected client");
			client._id = guid();
			//create context for the new conversation
			conversation.talk("", client._id, "telco")
				.then(watsonResponse => {
					context = watsonResponse.context;
				});
		}

		//when client connects, send him the greeting message from voice API
		client.send(voiceAPI.greetingMessage);

		winston.silly("Ready to listen for client connections");

		client.on("stream", function (stream, meta) {

			winston.verbose("client stream started");

			// let absolutePath = path.join(__dirname, "../audio/audio_client.raw");

			// stream.pipe(fs.createWriteStream(absolutePath));

			stream.on("data", audioChunk => {

				client.ASRClient.sendAudio(audioChunk);

			});


			
		});


	});

	client.ASRClient.on("response", userInput => {
	
		console.log("response from ASR CLient:",userInput);

		conversation.talk(userInput, this._id, "telco")

			.then(watsonResponse => {

				return voiceAPI.textToSpeech(watsonResponse.output.text[0]);
			})
			.then(audioFile => {
				
				client.send(audioFile.audioBuffer);
				winston.verbose("Stream sent to the client");
			})
			.catch(error => {
				winston.error(error);
			});
	});

	client.on("close", function () {
		winston.verbose("Client disconnected");
	});

});