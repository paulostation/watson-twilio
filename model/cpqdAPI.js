/** 
 * Implements the connection to CPqD Automatic Speech Recognition server
 * @module cpqdApi
 * @author Paulo Henrique <pauloh@br.ibm.com>  
 */

const request = require("request"),
	config = require("../config/cpqdServerConfig.json"),
	textToSpeechServer = config.textToSpeechServer,
	speechToTextServer = config.speechToTextServer,
	winston = require("../bin/logger.js");

var parseXML = require("xml2js").parseString;

/**
 * Converts text to speech
 * @param {String} text - text to be converted to speech
 * @returns {Buffer} buffer with converted speech
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

			parseXML(body, function (err, result) {
				if (err) {
					winston.error("Error ocurred while parsing xml");
					reject(error);
				}

				options.url = result.textToSpeech.url[0];

				let buffers = [];

				var stream = request(options)
					.on("error", error => {
						winston.error("Error ocurred while querying textToSpeech API:");
						reject(error);
					});

				stream.on("data", dataChunk => {
					buffers.push(dataChunk);
				});

				stream.on("end", () => {
					//return buffer with recognized speech
					resolve(Buffer.concat(buffers));
					winston.trace("Finished downloading audio, returning buffer...");
				});

			});
		})
			.on("error", error => {
				winston.error("Error ocurred while querying textToSpeech API:");
				reject(error);
			});
	});
}

/**
 * Converts speech to text
 * @param {Buffer} data - audio data to be converted to speech
 * @returns {String} text
 */
function speechToText(data) {

	return new Promise((resolve, reject) => {

		if (!Buffer.isBuffer(data))
			reject(new Error("data must be of type buffer"));

		request({
			method: "POST",
			url: speechToTextServer.url,
			headers: {
				"Content-Type": "audio/wav"
			},
			auth: {
				user: speechToTextServer.user,
				pass: speechToTextServer.pass
			},
			body: data
		}, (error, response, body) => {

			if (response.statusCode !== 200) {

				winston.trace("Status code: " + response.statusCode);
				winston.trace(body);
				reject(new Error("Error while querying CPqD speech to text API"));

			} else {
				//response body comes as string, parse it
				body = JSON.parse(body);

				if (body.alternatives[0]) {

					winston.trace("Response from CPqD Speech to text API: " + body.alternatives[0].text);
					resolve(body.alternatives[0].text);

				} else {

					reject(new Error("Couldn't parse speech"));
				}
			}
		})
			.on("error", function (err) {
				reject(err);
			});
	});
}

function speechToTextUsingWS(stream) {
	return new Promise((resolve, reject) => {
		
	}); 
}

module.exports = {
	textToSpeech: textToSpeech,
	speechToText: speechToText
};