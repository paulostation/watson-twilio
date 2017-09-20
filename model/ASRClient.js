const WebSocketClient = require("ws"),
	util = require("../util/util.js"),
	events = require("events"),
	parser = require("./CPqDASRParser"),
	ASRconstants = require("./CPqDASRConstants"),
	Stream = require("stream"),
	winston = require("../bin/logger.js");

function ASRClient(host) {
	//create new guid for client
	this.guid = util.guid();
	//client attributes
	this.state = ASRconstants.STATE.SESSION_NOT_CREATED;
	this.host = host;
	this.stream = new Stream();
	//client functions
	this.createSession = createSession;
	this.releaseSession = releaseSession;
	this.startRecognition = startRecognition;k
	this.connect = connect;
	this.sendAudio = sendAudio;
	// this.errorHandler = errorHandler;

	//copy all of the EventEmitter properties to the Door object.
	events.EventEmitter.call(this);

	winston.silly("New ASRClient instantiated");
}

//make ASR client inherit EventEmitter properties
ASRClient.prototype.__proto__ = events.EventEmitter.prototype;
//default error handler for ASR Client
function errorHandler(error) {
	winston.error(error);
	// this.emit("error", error);
}

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
			//after connection, create session
			this.createSession()
				.then(() => {
					this.emit("sessionCreated");
					return this.startRecognition();
				})
				.then(() => {
					this.state = ASRconstants.STATE.READY;
					this.emit("ready");
				})
				.catch(errorHandler);

		})
		.on("message", message => {

			message = message.toString();

			//for debug purposes
			winston.silly("Message arrived:");
			winston.silly(message);

			parser.parseResponse(message)
				.then(result => {

					switch (result.result) {
						case ASRconstants.RESULT_STATUS.NO_SPEECH:
							this.emit("response", "No speech detected");
							break;
						case ASRconstants.RESULT_STATUS.MAX_SPEECH:
							this.emit("response", result);
							break;
						case ASRconstants.RESULT_STATUS.RECOGNIZED:
							//parse and return response
							let jsonResponse = JSON.parse(result.jsonResponse);
							this.emit("response", jsonResponse.alternatives[0].text);
							//create a new session for the next recognition
							this.releaseSession()
								.then(() => {
									return this.createSession();
								})
								.then(() => {
									winston.silly("Uhull, criou outra sessão");
									return this.startRecognition();
								})
								.then(() => {
									winston.silly("Uhull, tá reconhecendo");
								})
								.catch(errorHandler);
							break;
						default:
							winston.silly("Outside switch case: ");
							winston.silly(result);
							break;
					}

				})
				.catch(error => {
					winston.error(error);
					this.emit(error);
				});
		})
		.on("error", errorHandler);
}

function createSession() {

	return new Promise((resolve, reject) => {

		var item = ASRconstants.PRODUCT + " " + ASRconstants.VERSION + " " + ASRconstants.WS_COMMANDS.CREATE_SESSION + ASRconstants.ENTER;
		item += "Channels: " + ASRconstants.CHANNELS + ASRconstants.ENTER;
		item += "Encoding: " + ASRconstants.SELECTED_ENCODING + ASRconstants.ENTER;
		item += "SampleRate: " + ASRconstants.SAMPLE_RATE + ASRconstants.ENTER;
		item += "SampleSizeInBits: " + ASRconstants.SAMPLE_SIZE_IN_BITS + ASRconstants.ENTER;

		this.wsClient.once("message", message => {

			message = message.toString();

			parser.parseResponse(message)
				.then(result => {

					if (result.method === ASRconstants.WS_COMMANDS.CREATE_SESSION
						&& result.result === ASRconstants.WS_RESPONSE_RESULTS.SUCCESS
						&& result.status === ASRconstants.SESSION_STATUS.IDLE) {

						winston.silly("Session created sucessfully");
						resolve(true);
					}
				})
				.catch(errorHandler);

		});

		this.wsClient.send(util.toUTF8Array(item), function ack(error) {

			if (error) {
				errorHandler(error);
			} else {
				winston.silly("Data sent to ASR Server:\n", item);
			}
		});

	});
}

function startRecognition() {

	return new Promise((resolve, reject) => {

		var body = ASRconstants.GRAMMAR_LM[0];

		var item = ASRconstants.PRODUCT + " " + ASRconstants.VERSION + " " + ASRconstants.WS_COMMANDS.START_RECOGNITION + ASRconstants.ENTER;
		item += "Content-Length: " + body.length + ASRconstants.ENTER;
		body += "NoInputTimeout: " + ASRconstants.NO_INPUT_TIMEOUT + ASRconstants.ENTER;
		item += "Content-Type: text/uri-list" + ASRconstants.ENTER + ASRconstants.ENTER;
		item += body;

		this.wsClient.once("message", message => {

			message = message.toString();

			parser.parseResponse(message)
				.then(result => {

					if (result.method === ASRconstants.WS_COMMANDS.START_RECOGNITION
						&& result.result === ASRconstants.WS_RESPONSE_RESULTS.SUCCESS
						&& result.status === ASRconstants.SESSION_STATUS.LISTENING) {

						winston.silly("Session created sucessfully, listening for audio data for 60 seconds");
						resolve(true);
					} else {
						reject(false);
					}
				})
				.catch(error => {
					reject(error);
				});




		});

		this.wsClient.send(util.toUTF8Array(item), function ack(error) {

			if (error) {
				errorHandler(error);
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

		var item = ASRconstants.PRODUCT + " " + ASRconstants.VERSION + " " + ASRconstants.WS_COMMANDS.SEND_AUDIO + ASRconstants.ENTER;
		item += "LastPacket: " + (data.length < 65536) + ASRconstants.ENTER;
		item += "Content-Length: " + data.length + ASRconstants.ENTER;
		item += "Content-Type: application/octet-stream" + ASRconstants.ENTER + ASRconstants.ENTER;

		let buffer = [];

		buffer.push(util.toUTF8ArrayBuffer(item));
		buffer.push(data);

		buffer = Buffer.concat(buffer);

		// this.wsClient.once("message", message => {

		// 	message = message.toString();

		// 	winston.silly("data received from server:");

		// 	winston.silly(message);

		// });

		this.wsClient.send(buffer, function ack(error) {

			if (error) {
				errorHandler(error);
			} else {
				winston.silly("Data sent to ASR Server:\n", item);
			}
		});
	});
}

function releaseSession() {

	return new Promise((resolve, reject) => {

		var item = ASRconstants.PRODUCT + " " + ASRconstants.VERSION + " " + ASRconstants.WS_COMMANDS.RELEASE_SESSION + ASRconstants.ENTER;

		this.wsClient.once("message", message => {

			message = message.toString();

			parser.parseResponse(message)
				.then(result => {
					console.log(result);
					if (result.method === ASRconstants.WS_COMMANDS.RELEASE_SESSION
						&& result.result === ASRconstants.WS_RESPONSE_RESULTS.SUCCESS) {

						winston.silly("Session released sucessfully.");
						resolve(true);
					}
				})
				.catch(error => {
					reject(error);
				});

		});

		this.wsClient.send(util.toUTF8Array(item), function ack(error) {

			if (error) {
				errorHandler(error);
			} else {
				winston.silly("Data sent to ASR Server:\n", item);
			}
		});
	});

}

module.exports = ASRClient;