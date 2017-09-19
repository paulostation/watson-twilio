const WebSocketClient = require("ws"),
	util = require("../util/util.js"),
	events = require('events'),
	parser = require("./CPqDASRParser"),
	ASRconstants = require("./CPqDASRConstants"),
	winston = require("../bin/logger.js");

function ASRClient(host) {

	this.guid = util.guid();
	this.sendAudio = sendAudio;
	this.state = ASRconstants.STATE.SESSION_NOT_CREATED;
	this.createSession = createSession;
	this.startRecognition = startRecognition;
	this.connect = connect;
	this.host = host;

	//copy all of the EventEmitter properties to the Door object.
	events.EventEmitter.call(this);

	winston.silly("New ASRClient instantiated");
}

//make ASR client inherit EventEmitter properties
ASRClient.prototype.__proto__ = events.EventEmitter.prototype;

function connect() {

	if (this.state == ASRconstants.STATE.READY) {

		winston.warning("Client is already connected, no need to connect again");
		this.emit("connected");
		return;
	}

	this.wsClient = new WebSocketClient(this.host)
		.on("open", () => {

			winston.silly("ASR Client connected to server");
			//send connected event
			this.emit("connected");

		})

		.on("message", message => {

			message = message.toString();

			//for debug purposes
			winston.silly("Message arrived:");
			winston.silly(message);

			parser.parseResponse(message)
				.then(result => {
					// winston.verbose(result);
				})
				.catch(error => {
					winston.error(error);
				});
		})
		.on("error", error => {
			//send error event
			this.emit("error", error);
		});
}

function createSession() {

	var item = ASRconstants.PRODUCT + " " + ASRconstants.VERSION + " " + ASRconstants.WS_COMMANDS.CREATE_SESSION + ASRconstants.ENTER;
	item += "Channels: " + ASRconstants.CHANNELS + ASRconstants.ENTER;
	item += "Encoding: " + ASRconstants.SELECTED_ENCODING + ASRconstants.ENTER;
	item += "SampleRate: " + ASRconstants.SAMPLE_RATE + ASRconstants.ENTER;
	item += "SampleSizeInBits: " + ASRconstants.SAMPLE_SIZE_IN_BITS + ASRconstants.ENTER;

	this.wsClient.once("message", message => {

		message = message.toString();

		parser.parseResponse(message)
			.then(() => {
				winston.silly("Session created sucessfully");
				return this.startRecognition();
			})
			.then(() => {

				this.state = ASRconstants.STATE.READY;
				this.emit("ready");
			})
			.catch(error => {
				this.emit("error", error);
			});
	});

	this.wsClient.send(util.toUTF8Array(item), function ack(error) {

		if (error) {
			this.error(error);
		} else {
			winston.silly("Data sent to ASR Server:\n", item);
		}
	});
}

function error(error) {
	this.emit("error", error);
}

function startRecognition() {

	return new Promise((resolve, reject) => {

		var body = ASRconstants.GRAMMAR_LM[0];

		var item = ASRconstants.PRODUCT + " " + ASRconstants.VERSION + " " + ASRconstants.WS_COMMANDS.START_RECOGNITION + ASRconstants.ENTER;
		item += "Content-Length: " + body.length + ASRconstants.ENTER;
		item += "Content-Type: text/uri-list" + ASRconstants.ENTER + ASRconstants.ENTER;
		item += body;

		this.wsClient.once("message", message => {

			message = message.toString();

			parser.parseResponse(message)
				.then(() => {

					winston.silly("ASR recognition session started sucessfully");

					resolve(true);

				})
				.catch(error => {
					reject(error);
				});

		});

		this.wsClient.send(util.toUTF8Array(item), function ack(error) {

			if (error) {
				this.error(error);
			} else {
				winston.silly("Data sent to ASR Server:\n", item);
			}
		});
	});
}

function sendAudio(data) {

	new Promise((resolve, reject) => {

		if (this.state != ASRconstants.STATE.READY) {

			winston.error("ASR Client is not ready");
			return;
		}

		// if (data.length < 65536) {

		// 	this.wsClient.once("message", message => {

		// 		message = message.toString();

		// 		parser.parseResponse(message)
		// 			.then(() => {

		// 				resolve(true);

		// 			})
		// 			.catch(error => {
		// 				reject(error);
		// 			});

		// 	});
		// }

		var item = ASRconstants.PRODUCT + " " + ASRconstants.VERSION + " " + ASRconstants.WS_COMMANDS.SEND_AUDIO + ASRconstants.ENTER;
		item += "LastPacket: " + (data.length < 65536) + ASRconstants.ENTER;
		item += "Content-Length: " + data.length + ASRconstants.ENTER;
		item += "Content-Type: application/octet-stream" + ASRconstants.ENTER + ASRconstants.ENTER;

		let buffer = [];

		buffer.push(util.toUTF8ArrayBuffer(item));
		buffer.push(data);


		buffer = Buffer.concat(buffer);

		this.wsClient.send(util.toUTF8Array(item), function ack(error) {

			if (error) {
				this.error(error);
			} else {
				winston.silly("Data sent to ASR Server:\n", item);
			}
		});
	});
}

module.exports = ASRClient;