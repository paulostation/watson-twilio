/** 
 * This file handles file conversion
 * @author Paulo Henrique <pauloh@br.ibm.com>   
 */
const winston = require("../bin/logger.js"),
	path = require("path"),
	fs = require("fs");

function resampleTo8KHz(filename) {

	return new Promise((resolve, reject) => {
		
		const {
			spawn
		} = require("child_process");
		let outputPath = path.join(__dirname, "../audio/audio_convertido.wav");

		const deploySh = spawn("ffmpeg", ["-y", "-i", filename, "-ar", "8000", "-acodec", "pcm_s16le", "-ac", "1", outputPath], {});

		let stdout = "";
		let stderr = "";
		deploySh.stdout.on("data", (data) => {

			stdout += data;
			// console.log(`stdout: ${data}`);
		});

		deploySh.stderr.on("data", (data) => {
			stderr += data;
			winston.log("verbose",stderr);
		});

		deploySh.on("close", (statusCode) => {

			winston.debug(stdout);

			if (statusCode === 0) {

				fs.readFile(outputPath, (err, data) => {

					(err) ? reject(err) : resolve(data);

				});

			} else {

				reject(new Error("File not found when sending WAV"));
			}

		});

	});

}

module.exports = {
	resampleTo8KHz: resampleTo8KHz
};