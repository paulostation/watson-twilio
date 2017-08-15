var express = require("express");
var BinaryServer = require("binaryjs").BinaryServer;
var fs = require("fs");

const wav = require("wav");

var cpqdApiController = require("./modules/cpqdApiController.js");

var conversation = require("./modules/watsonConversationController.js");

var port = 3700;
var app = express();

app.set("views", __dirname + "/tpl");
app.set("view engine", "jade");
app.engine("jade", require("jade").__express);
app.use(express.static(__dirname + "/public"));

app.get("/", function (req, res) {
	res.render("index");
});

app.listen(port);



var fileWriter = null;

// request("https://speech.cpqd.com.br/asr/rest/v1/recognize/8k", options, data => {
// console.log(data);
// });


// request('http://www.google.com', function (error, response, body) {
//   console.log('error:', error); // Print the error if one occurred
//   console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
//   console.log('body:', body); // Print the HTML for the Google homepage.
// });

var socketClient;

var stopWatch;

var context;



function endStream() {
	return new Promise((resolve, reject) => {
		stopWatch = new Date().getTime();
		console.log("file written");
		fileWriter.end();

		const {
			spawn
		} = require("child_process");

		const deploySh = spawn("ffmpeg", ["-y", "-i", "./audio/demo.wav", "-ar", "8000", "-acodec", "pcm_s16le", "-ac", "1", "./audio/audio_convertido.wav"], {});

		let output = "";
		deploySh.stdout.on("data", (data) => {

			output += data;
			// console.log(`stdout: ${data}`);
		});

		deploySh.stderr.on("data", (data) => {
			output += data;
			// console.log(`stderr: ${data}`);
		});

		deploySh.on("close", (code) => {
			// console.log(output);

			(code === 0) ?
				resolve("./audio/audio_convertido.wav")
				:
				reject(new Error("File not found when sending WAV"));



		});

	});


}

console.log("server open on port " + port);

var binaryServer = BinaryServer({ port: 9001 });

binaryServer.on("connection", function (client) {

	console.log("new connection");

	//when client connects, send him the greeting message from Watson Conversation
	client.send(fs.createReadStream(conversation.watsonGreetingAudioPath));

	conversation.message("")
		.then(result => {

			context = result.context;
		});

	client.on("stream", function (stream, meta) {
		console.log("new stream");

		fileWriter = new wav.FileWriter("./audio/demo.wav", {
			channels: 1,
			sampleRate: 44100,
			bitDepth: 16
		});

		stream.pipe(fileWriter);

		stream.on("end", () => {
			var stopWatch = new Date().getTime();
			var start = stopWatch;
			let elapsedTime;
			endStream()
				.then(audioFilePath => {
					elapsedTime = new Date().getTime() - stopWatch;
					console.log("Audio file converted in", elapsedTime, "ms");
					stopWatch = new Date().getTime();
					return cpqdApiController.speechToText(audioFilePath);
				})
				.then(userInput => {
					elapsedTime = new Date().getTime() - stopWatch;
					console.log();
					console.log("Parsed speech in", elapsedTime, "ms");
					stopWatch = new Date().getTime();

					return conversation.message(userInput, context);
				})
				.then(watsonResponse => {
					context = watsonResponse.context;
					elapsedTime = new Date().getTime() - stopWatch;
					console.log("watsonResponse:", watsonResponse.output.text[0]);
					console.log("Generated in ", elapsedTime, "ms\n");

					stopWatch = new Date().getTime();

					return conversation.textToSpeech(watsonResponse.output.text[0]);
				})
				.then(audioFilePath => {
					elapsedTime = new Date().getTime() - stopWatch;
					let totalElapsedTime = new Date().getTime() - start;
					console.log();
					console.log("Speech generated in", elapsedTime, "ms");
					
					console.log("totalElapsedTime:", totalElapsedTime);
					client.send(fs.createReadStream(audioFilePath));
				})
				.catch(error => {
					console.log(error);
				});
		});
	});

	client.on("close", function () {
		if (fileWriter != null) {
			endStream(client);
		}
	});

});
