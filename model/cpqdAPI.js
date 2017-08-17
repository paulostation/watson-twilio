/** 
 * Implements the connection to CPqD Automatic Speech Recognition server
 * @module cpqdApi
 * @author Paulo Henrique <pauloh@br.ibm.com>  
 */

const request = require("request"),
	config = require("../config/cpqdServerConfig.json"),
	textToSpeechServer = config.textToSpeechServer,
	speechToTextServer = config.speechToTextServer,
	fs = require("fs"),
	path = require("path");

var parseXML = require("xml2js").parseString;




/**
 * Transforms text in speech and saves to file
 * @param {String} text - text to be converted to speech
 * @returns {String} path where the speech audio file is
 */
function textToSpeech(text) {

	return new Promise((resolve, reject) => {

		let options = {
			url: textToSpeechServer.url,
			port: textToSpeechServer.port,
			qs: {
				text: text,
				voice: textToSpeechServer.voice
			},
			auth: {
				user: textToSpeechServer.user,
				pass: textToSpeechServer.pass
			},
			method: "GET"
		};

		request(options, (error, response, body) => {

			var xml = "<root>Hello xml2js!</root>";
			parseXML(body, function (err, result) {
				if (err) {
					console.log("Error ocurred while parsing xml");
					reject(error);
				}

				let fileName = path.join(__dirname, "../audio/" + Math.random() * 100000 + ".wav");

				options.url = result.textToSpeech.url[0];

				let buffers = [];
				// stdout.on('data', function (d) { bufs.push(d); });
				// stdout.on('end', function () {


				var stream = request(options, (error, request, body) => {
					resolve(body);
				})
					.on("error", error => {
						console.error("Error ocurred while querying textToSpeech API:");
						reject(error);
					})

				stream.on('data', dataChunk => {

					buffers.push(dataChunk);
				});

				stream.on("end", () => {
					resolve(Buffer.concat(buffers));
				});

			});
		})
			.on("error", error => {
				console.error("Error ocurred while querying textToSpeech API:");
				reject(error);
			});
	})

		.catch(error => {
			reject(error);
		});
}

/**
 * Transforms speech in text
 * @param {blob} data - audio data to be converted to speech
 * @returns {String} text
 */
function speechToText(data) {

	return new Promise((resolve, reject) => {

		if (!Buffer.isBuffer(data))
			reject(new Error("data must be of type buffer"));

		// fs.readFile(audioFilePath, function read(err, data) {
		// if (err) {
		// throw new Error(err);
		// }
		request({
			method: "POST",
			url: speechToTextServer.url,
			headers: {
				// "Transfer-Encoding": "chunked",
				"Content-Type": "audio/wav"
			},
			auth: {
				user: speechToTextServer.user,
				pass: speechToTextServer.pass
			},
			body: data
		},
			(error, response, body) => {

				body = JSON.parse(body);

				if (body.alternatives[0]) {
					console.log("parsed speech");
					resolve(body.alternatives[0].text);
				} else {
					//return 
					resolve("blubbers");
				}

			})
			.on("error", function (err) {
				reject(err);
			});
		// });
	});
}

module.exports = {
	// speechToText: speechToText,
	textToSpeech: textToSpeech,
	speechToText: speechToText
};