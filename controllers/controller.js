/** 
 * This file handles websocket connections from the client
 * @module controller
 * @author Paulo Henrique <pauloh@br.ibm.com>   
 */

const winston = require("../bin/logger.js"),
	voiceAPI = require("../model/voiceAPI.js"),

	converter = require("../model/fileConverter.js"),
	path = require("path"),
	fs = require("fs"),
	toWav = require("audiobuffer-to-wav"),
	wav = require("wav"),
	streamTo = require("stream-to-array"),


	conversation = require("../model/conversationAPI.js");

let { binaryServer } = require("../bin/webServer");





// var Resampler = require('resampler');

// Pass the input and output sample rates to the constructor: 
// var resampler = new Resampler(44100, 8000);

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

binaryServer.on("connection", function (client) {

	winston.debug("new connection");

	//when client connects, send him the greeting message from voice API
	client.send(voiceAPI.greetingMessage);

	if (!client._id) {
		winston.log("verbose", "Creating a new clientID for the new connected client");
		client._id = guid();
		conversation.talk("", client._id);

	}

	client.on("stream", function (stream, meta) {
		winston.info("new stream");

		let absolutePath = path.join(__dirname, "../audio/audio_client.raw");

		stream.pipe(fs.createWriteStream(absolutePath));

		let buffers = [];

		stream.on("data", data => {
			buffers.push(data);
		});

		stream.on("end", () => {

			console.log("stream ended");

			winston.info("file written");
			// fileWriter.end();
			var stopWatch = new Date().getTime();
			var start = stopWatch;
			let elapsedTime;

			converter.resampleTo8KHz(absolutePath)
				.then(audioFilePath => {

					elapsedTime = new Date().getTime() - stopWatch;
					console.log("Audio file converted in", elapsedTime, "ms");
					stopWatch = new Date().getTime();
					return voiceAPI.speechToText(audioFilePath);
				})
				.then(userInput => {

					elapsedTime = new Date().getTime() - stopWatch;
					console.log();
					console.log("Parsed speech to text in", elapsedTime, "ms");
					console.log("User input: ", userInput);
					stopWatch = new Date().getTime();

					return conversation.talk(userInput, this._id);
				})
				.then(watsonResponse => {

					context = watsonResponse.context;
					elapsedTime = new Date().getTime() - stopWatch;
					console.log("watsonResponse:", watsonResponse.output.text[0]);
					console.log("Generated in ", elapsedTime, "ms\n");

					stopWatch = new Date().getTime();

					return voiceAPI.textToSpeech(watsonResponse.output.text[0]);
				})
				.then(audioFile => {

					elapsedTime = new Date().getTime() - stopWatch;
					let totalElapsedTime = new Date().getTime() - start;
					console.log();
					console.log("Speech generated in", elapsedTime, "ms");

					console.log("totalElapsedTime:", totalElapsedTime, "ms");

					client.send(audioFile);
				})
				.catch(error => {
					console.log(error);
				});
		});
	});

	client.on("close", function () {
		winston.info("Client disconnected");
	});

});