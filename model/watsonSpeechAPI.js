/** 
 * Implements the connection to Watson Speech APIs
 * @module watsonSpeechAPI
 * @author Paulo Henrique <pauloh@br.ibm.com>   
 */

const TextToSpeechV1 = require("watson-developer-cloud/text-to-speech/v1");

//Set up text to speech service wrapper
var text_to_speech = new TextToSpeechV1({
	username: "f1e10a38-39bb-426f-a402-d278502792e6",
	password: "HJctMn0kjkwQ"
});

function watsonTextToSpeech(text, fileName) {

	return new Promise((resolve, reject) => {

		if (!text)
			reject("Text is not defined");

		if (!fileName)
			reject("file name is not defined");

		var params = {
			text: text,
			voice: "pt-BR_IsabelaVoice",
			accept: "audio/wav"
		};

		// Pipe the synthesized text to a file.
		var stream = text_to_speech.synthesize(params)
			.on("error", function (error) {
				console.log("Error:", error);
				reject(error);
			}).pipe(fs.createWriteStream(fileName))
			.on("finish", () => {
				resolve(fileName);
			});
	});

}

module.exports = {
	watsonTextToSpeech: watsonTextToSpeech
}