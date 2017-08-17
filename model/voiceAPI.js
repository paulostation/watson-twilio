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
				console.log(Buffer.isBuffer(audioBuffer));
				module.exports.greetingMessage = audioBuffer;
				resolve(true);
			})
			.then(() => {				
				return getHashedFiles(path.join(__dirname, "../audio/preprocessed/"));
			})
			.then(result => {
				hashedAudioFiles = result;
			})
			.catch(error => {
				console.log(error)
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

	//Create a new hash from text
	let hash = hashCode(text);
	let filePath = path.join(__dirname, "../audio/preprocessed/" + hash + ".wav");
	//used to match hash with file name
	hash = hash + ".wav";

	let found = hashedAudioFiles.filter(hashedAudioFile => {

		return hashedAudioFile.fileName === hash;

	});

	if (found.length) {

		console.log("File already hashed");

		return (found[0].data);
	} else {
		return cpqdAPI.textToSpeech(text);
	}



}

function speechToText(speech) {

	return cpqdAPI.speechToText(speech);
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