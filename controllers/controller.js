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
	wav = require("node-wav", )
streamTo = require("stream-to-array"),


	conversation = require("../model/conversationAPI.js");

let { binaryServer } = require("../bin/webServer");

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

		let absolutePath = path.join(__dirname, "../audio/audio.raw");

		let fileWriter = new wav.FileWriter(absolutePath, {
			channels: 1,
			sampleRate: 44100,
			bitDepth: 16
		});


		const fs = require("fs");
		const WavEncoder = require("wav-encoder");

		const whiteNoise1sec = {
			sampleRate: 44100,
			channelData: [
				new Float32Array(44100).map(() => Math.random() - 0.5),
				new Float32Array(44100).map(() => Math.random() - 0.5)
			]
		};

		WavEncoder.encode(whiteNoise1sec).then((buffer) => {
			fs.writeFileSync("noise.wav", new Buffer(buffer));
		});
		// Buffer.
		stream.pipe(fileWriter);

		// let buffers = [];

		// stream.on("data", data => {
		// buffers.push(data);
		// });

		// var converter = new stream.Writable();
		// converter.data = []; // We'll store all the data inside this array
		// converter._write = function (chunk) {
		// 	this.data.push(chunk);
		// };
		// converter.on('end', function () { // Will be emitted when the input stream has ended, ie. no more data will be provided
		// 	var b = Buffer.concat(this.data); // Create a buffer from all the received chunks
		// 	// Insert your business logic here
		// 	console.log(b);
		// });

		stream.on("end", () => {

			console.log("stream ended");

			// buffers = Buffer.concat(buffers);


			// fs.writeFile(absolutePath, buffers, err => {
			// 	if(err)
			// 		console.log(err);
			// 	else
			// 		console.log("Done writing wav file");
			// });

			// winston.info("file written");
			// // fileWriter.end();
			// var stopWatch = new Date().getTime();
			// var start = stopWatch;
			// let elapsedTime;

			// converter.resampleTo8KHz(absolutePath)
			// 	.then(audioFilePath => {

			// 		elapsedTime = new Date().getTime() - stopWatch;
			// 		console.log("Audio file converted in", elapsedTime, "ms");
			// 		stopWatch = new Date().getTime();
			// 		return voiceAPI.speechToText(audioFilePath);
			// 	})
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
			// 		console.log("Generated in ", elapsedTime, "ms\n");

			// 		stopWatch = new Date().getTime();

			// 		return voiceAPI.textToSpeech(watsonResponse.output.text[0]);
			// 	})
			// 	.then(audioFile => {

			// 		elapsedTime = new Date().getTime() - stopWatch;
			// 		let totalElapsedTime = new Date().getTime() - start;
			// 		console.log();
			// 		console.log("Speech generated in", elapsedTime, "ms");

			// 		console.log("totalElapsedTime:", totalElapsedTime, "ms");

			// 		client.send(audioFile);
			// 	})
			// 	.catch(error => {
			// 		console.log(error);
			// 	});
		});
	});

	client.on("close", function () {
		winston.info("Client disconnected");
	});

});