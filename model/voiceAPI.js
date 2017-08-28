const cpqdAPI = require("./cpqdAPI.js"),
	conversation = require("./conversationAPI.js"),
	path = require("path"),
	fs = require("fs"),
	request = require("request"),
	winston = require("../bin/logger.js");

let greetingMessage,
	greetingMessagePath;

var hashedAudioFiles = [];

function init() {

	return new Promise((resolve, reject) => {

		conversation.talk("", "greeting_message")
			.then(response => {
				return cpqdAPI.textToSpeech(response.output.text[0]);
			})
			.then(audioBuffer => {
				module.exports.greetingMessage = audioBuffer;

				//also, save file to disk
				let greetingMessagePath = path.join(__dirname, "../audio/preprocessed/greeting_message.wav");

				module.exports.greetingMessagePath = greetingMessagePath;

				fs.writeFile(greetingMessagePath, audioBuffer, err => {

					if (err)
						reject(err);

					winston.trace("Greeting message saved at: " + greetingMessagePath);

				});
			})
			.then(() => {
				return getHashedFiles(path.join(__dirname, "../audio/preprocessed/"));
			})
			.then(result => {
				hashedAudioFiles = result;
				resolve(true);
			})
			.catch(error => {
				reject(error);
			});
	});
}

function hashCode(text) {

	var hash = 0, i, chr;

	if (text.length === 0) return hash;

	for (i = 0; i < text.length; i++) {
		chr = text.charCodeAt(i);
		hash = ((hash << 5) - hash) + chr;
		hash |= 0; // Convert to 32bit integer
	}

	return Math.abs(hash);
}

function textToSpeech(text) {

	return new Promise((resolve, reject) => {
		//Create a new hash from text
		let hash = hashCode(text);
		//.wav used to match hash with file name
		hash = hash + ".wav";

		let found = hashedAudioFiles.filter(hashedAudioFile => {

			return hashedAudioFile.fileName === hash;

		});

		if (found.length) {

			winston.verbose("File already hashed");


			resolve({
				audioBuffer: found[0].data,
				fileName: hash
			});
			
		} else {
			winston.verbose("File not hashed");

			cpqdAPI.textToSpeech(text)
				//save new hashedAudio file
				.then(audioBuffer => {
					let newHashFilePath = path.join(__dirname, "../audio/preprocessed", hash);
					fs.writeFile(newHashFilePath, audioBuffer, err => {
						if (err) {
							winston.error("Error while saving new file to hash folder");
							reject(err);
						} else {
							winston.debug("Sucessfully saved new file " + newHashFilePath + " into hash folder");
							updateHashedFiles();
							resolve({
								audioBuffer: audioBuffer,
								fileName: hash
							});
						}
					});
				})
				.catch(error => {
					reject(error);
				});
		}
	});

}

function speechToText(speech) {

	return new Promise((resolve, reject) => {

		cpqdAPI.speechToText(speech)
			.then(text => {
				resolve(text);
			})
			.catch(error => {
				winston.error(error);
				//returning gibberish in order to trigger watson "didn't understand" response
				resolve("blubbers");
			});
	});
}

function updateHashedFiles() {

	getHashedFiles(path.join(__dirname, "../audio/preprocessed/"))
		.then(result => {
			hashedAudioFiles = result;
			winston.info("Updated hashed files in memory");
		})
		.catch(error => {
			winston.error(error);
		});
}

function getHashedFiles(dirName) {

	var promiseArray = [];

	return new Promise((resolve, reject) => {

		fs.readdir(dirName, (err, files) => {
			if (err) {
				reject(err);
			} else {

				files.forEach(file => {

					let promise = new Promise((resolve, reject) => {

						fs.readFile(dirName + file, (err, data) => {
							if (err) {
								reject(err);
							} else {

								resolve({
									fileName: file,
									data: data
								});
							}

						});
					});

					promiseArray.push(promise);

				});

				Promise.all(promiseArray)
					.then(result => {
						resolve(result);
					})
					.catch(error => {
						reject(error);
					});
			}
		});
	});

}

function getAudioBufferFromFile(path) {

	return new Promise(function (resolve, reject) {
		fs.readFile(path, function (err, data) {
			if (err)
				reject(err);
			else
				resolve(data);
		});
	});

}

function downloadAudioFromURLandSaveToFile(url, id) {

	var newPath = path.join(__dirname, "../audio/calls/") + id + ".wav";

	return new Promise(function (resolve, reject) {

		winston.verbose("Downloading audio from " + url);

		let options = {
			url: url,
			method: "GET"
		};

		request(options, (error, request, body) => {
			// resolve(body);
			// console.log()
		})
			.on("error", error => {
				winston.error("Error ocurred while downloading audio from twilio");
				reject(error);
			})
			.on("end", () => {
				winston.verbose("Audio from twilio saved to " + newPath);
			})
			.pipe(fs.createWriteStream(newPath));
	});
}

function getAudioFromURL(url) {

	return new Promise(function (resolve, reject) {

		winston.verbose("Downloading audio from " + url);

		let options = {
			url: url,
			method: "GET"
		};

		let buffers = [];

		var stream = request(options, (error, request, body) => {

		})
			.on("error", error => {
				winston.error("Error ocurred while downloading audio from twilio");
				reject(error);
			});

		stream.on("data", dataChunk => {

			buffers.push(dataChunk);
		});

		stream.on("end", () => {
			winston.verbose("Finished downloading audio from twilio");
			//return buffer with recognized speech
			resolve(Buffer.concat(buffers));
		});
	});
}

module.exports = {
	init: init,
	greetingMessage: greetingMessage,
	textToSpeech: textToSpeech,
	speechToText: speechToText,
	greetingMessagePath: greetingMessagePath,
	downloadAudioFromURLandSaveToFile: downloadAudioFromURLandSaveToFile,
	getAudioBufferFromFile: getAudioBufferFromFile,
	getAudioFromURL: getAudioFromURL
};