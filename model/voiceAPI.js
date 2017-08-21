const cpqdAPI = require("./cpqdAPI.js"),
	conversation = require("./conversationAPI.js"),
	path = require("path"),
	fs = require("fs"),
	winston = require("../bin/logger.js");

var greetingMessage;

var hashedAudioFiles = [];

function init() {

	return new Promise((resolve, reject) => {

		conversation.talk("", "greeting_message")
			.then(response => {
				return cpqdAPI.textToSpeech(response.output.text[0]);
			})
			.then(audioBuffer => {
				module.exports.greetingMessage = audioBuffer;
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

			resolve(found[0].data);
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
							resolve(audioBuffer);
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

module.exports = {
	init: init,
	greetingMessage: greetingMessage,
	textToSpeech: textToSpeech,
	speechToText: speechToText
};