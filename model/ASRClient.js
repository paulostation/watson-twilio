const WebSocketClient = require("ws"),
	util = require("../util/util.js"),
	WebSocket = require("ws"),
	winston = require("../bin/logger.js");

let SESSION_NOT_CREATED = 0;
let READY = 1;
let RECOGNITION_STARTED = 2;
let RECOGNIZING = 3;

let WS_COMMANDS = {
	CREATE_SESSION: "CREATE_SESSION",
	START_RECOGNITION: "START_RECOGNITION",
	SEND_AUDIO: "SEND_AUDIO",
	CANCEL_RECOGNITION: "CANCEL_RECOGNITION",
	RELEASE_SESSION: "RELEASE_SESSION",
	GET_SESSION_STATUS: "GET_SESSION_STATUS"
};

let WS_RESPONSES = {
	RESPONSE: "RESPONSE",
	RECOGNITION_RESULT: "RECOGNITION_RESULT",
	START_OF_SPEECH: "START_OF_SPEECH",
	END_OF_SPEECH: "END_OF_SPEECH"
};

let ENCODING_TYPES = {
	ALAW: "ALAW", //ainda não suportado pelo servidor
	PCM_FLOAT: "PCM_FLOAT", //ainda não suportado pelo servidor
	PCM_SIGNED: "PCM_SIGNED",
	PCM_UNSIGNED: "PCM_UNSIGNED", //ainda não suportado pelo servidor
	ULAW: "ULAW" // ainda não suportado pelo servidor 
};

let WS_RESPONSE_RESULTS = {
	SUCCESS: "SUCCESS",
	FAILURE: "FAILURE",
	INVALID_ACTION: "INVALID_ACTION"
};

var PRODUCT = "ASR";
var VERSION = "2.1";
var CHANNELS = "1"; //1- mono 2- stereo
var SELECTED_ENCODING = ENCODING_TYPES.PCM_SIGNED;
var SAMPLE_RATE = "8.0";
var SAMPLE_SIZE_IN_BITS = "16";
var GRAMMAR_LM = ["builtin:slm/general"];
// var CONFIDENCE_THRESHOLD = 30; // Valores de 0 a 100
// var MAX_SENTENCE = 5; // valores de 1 a 5
// var NO_INPUT_TIMEOUT = 3000 // Tempo de finalização por silencio em milis
// var RECOGNITION_TIMEOUT = 3000; // Tempo máximo de reconhecimento de fala
// var TIMER_ENABLED = true; // Timer de reconhecimento deve ser utilizado
// var GRAMMAR_LM = ["ptbr-16k-1.0.0/slm/general"]; // lista de gramaticas a serem utilizadas no reconhecimento
// var serverStatus = SESSION_STATUS.OFFLINE;
var ENTER = "\r\n";



function ASRClient() {

	this.guid = util.guid();

	this.send = send;
	this.state = SESSION_NOT_CREATED;
	this.createSession = createSession;
	this.startRecognition = startRecognition;
	this.connect = connect;

	// winston.silly("connection created for new ASR Client");

	// winston.silly(wsClient);

	// this.socketConnection 	= wsClient;
	winston.silly("New ASRClient instantiated");
}

function connect() {

	return new Promise((resolve, reject) => {

		if (this.state == READY) {

			winston.warning("Client is already connected, no need to connect again");
			resolve(true);
			return;
		}

		this.wsClient = new WebSocketClient("ws://9.18.180.254:8025/asr-server/asr")
			.on("open", () => {
				winston.silly("ASR Client connected to server");

				this.createSession()
					.then(result => {
						resolve(result);
					});
			})
			.once("message", message => {

				parseResponse(message.toString());
			})
			.on("error", error => {
				winston.error("Error while connecting to ASR Server");
				winston.error(error);
				reject(error);
			});
	});
}

function createSession() {

	return new Promise((resolve, reject) => {

		var item = PRODUCT + " " + VERSION + " " + WS_COMMANDS.CREATE_SESSION + ENTER;
		item += "Channels: " + CHANNELS + ENTER;
		item += "Encoding: " + SELECTED_ENCODING + ENTER;
		item += "SampleRate: " + SAMPLE_RATE + ENTER;
		item += "SampleSizeInBits: " + SAMPLE_SIZE_IN_BITS + ENTER;

		this.wsClient.once("message", message => {

			message = message.toString();

			parseResponse(message)
				.then(() => {

					winston.silly("ASR Session created for new client");

					resolve(true);

				})
				.catch(error => {
					reject(error);
				});

		});

		this.wsClient.send(util.toUTF8Array(item), function ack(error) {

			if (error) {
				winston.error("Error while creating session");
				reject(error);
			}
		});
	});
}

//despreza o cabeçalho presente nas mensagens vindas do servidor e retorna o restante
function getResponse(arrValues) {
	var value = arrValues[0];
	return value.substring(value.lastIndexOf(" ") + 1);
}

//Verifica se o valor retornado retornou sucesso
function isResponseSuccessfull(value) {
	return value == WS_RESPONSE_RESULTS.SUCCESS;
}

//converte o array fornecido em um objeto to Tipo Response, que é um dos tipos possíveis de reposta do servidor descrita pelo Protocolo
function prepareResponse(arrValues) {
	
	var objResponse = {};

	arrValues.forEach(function (value, index) {
		if (value.indexOf("Session-Status: ") != -1) {
			objResponse.status = value.replace("Session-Status: ", "");
			let serverStatus = objResponse.status; //atualiza a informação de status do servidor localmente
			// console.log("serverStatus prepareResponse = " + serverStatus);
		}
		if (value.indexOf("Method: ") != -1)
			objResponse.method = value.replace("Method: ", "");
		if (value.indexOf("Result: ") != -1)
			objResponse.result = value.replace("Result: ", "");
	});
	return objResponse;
}

//trata um objeto Response vindo do servidor
function validateResponse(arrValues) {

	return new Promise((resolve, reject) => {

		var objResponse = prepareResponse(arrValues);

		if (isResponseSuccessfull(objResponse.result)) {
			switch (objResponse.method) {
				case WS_COMMANDS.CREATE_SESSION:
					this.state = READY;
					resolve(READY)
					break;
				case WS_COMMANDS.START_RECOGNITION:
					config.onListening();
					break;
				case WS_COMMANDS.SEND_AUDIO:
					break;
				case WS_COMMANDS.CANCEL_RECOGNITION:
					config.onRecognitionStopped();
					break;
				case WS_COMMANDS.RELEASE_SESSION:
					break;
				case WS_COMMANDS.GET_SESSION_STATUS:
					break;
			}
		}
		else {
			reject(new Error("Invalid response: " + objResponse.result));
		}
	});

}

//trata um objeto RecognitionResult vindo do servidor
function validateRecognitionResult(arrValue) {
	var objRecognitionResult = prepareRecognitionResult(arrValue);
	if ([RESULT_STATUS.NONE, RESULT_STATUS.PROCESSING, RESULT_STATUS.RECOGNIZED, RESULT_STATUS.NO_MATCH, RESULT_STATUS.NO_INPUT_TIMEOUT, RESULT_STATUS.MAX_SPEECH, RESULT_STATUS.EARLY_SPEECH, RESULT_STATUS.RECOGNITION_TIMEOUT, RESULT_STATUS.NO_SPEECH, RESULT_STATUS.CANCELED, RESULT_STATUS.FAILURE].indexOf(objRecognitionResult.result) != -1) {
		if (objRecognitionResult.result == RESULT_STATUS.PROCESSING) {
			config.onPartialResult(objRecognitionResult);
		}
		else {
			//console.log("$$$$ considerando FINAL -> " + RESULT_STATUS);
			config.onFinalResult(objRecognitionResult);
		}

		if ([RESULT_STATUS.RECOGNIZED, RESULT_STATUS.NO_MATCH, RESULT_STATUS.NO_INPUT_TIMEOUT, RESULT_STATUS.MAX_SPEECH, RESULT_STATUS.EARLY_SPEECH, RESULT_STATUS.RECOGNITION_TIMEOUT, RESULT_STATUS.NO_SPEECH, RESULT_STATUS.CANCELED, RESULT_STATUS.FAILURE].indexOf(objRecognitionResult.result) != -1) {
			// closeConnection();
		}
	}
}

//trata um objeto validateStartOfSpeech vindo do servidor
function validateStartOfSpeech(arrValue) {
	var objOfSpeech = prepareOfSpeech(arrValue);
	if (SESSION_STATUS.LISTENING != objOfSpeech.result) {

	}
}

//trata um objeto validateEndOfSpeech vindo do servidor
function validateEndOfSpeech(arrValue) {
	var objOfSpeech = prepareOfSpeech(arrValue);
	//console.log("########## validateEndOfSpeech ##########");
	//console.log(objOfSpeech.status);
	if ([SESSION_STATUS.PROCESSING, SESSION_STATUS.RECOGNIZED].indexOf(objOfSpeech.status) != -1) {
		config.onEndOfSpeech();
	}
}

function parseResponse(response) {

	return new Promise((resolve, reject) => {
		//identifica uma resposta do servidor segundo especificação do protocolo de comunicação estabelecido		
		var arrValues = response.split(ENTER);
		var strResponse = getResponse(arrValues);
		
		switch (strResponse) {
			case WS_RESPONSES.RESPONSE: //respostas gerais do servidor
				resolve(validateResponse(arrValues));
				break;
			case WS_RESPONSES.RECOGNITION_RESULT: //resposta de reconhecimento de fala
				validateRecognitionResult(arrValues);
				break;
			case WS_RESPONSES.START_OF_SPEECH: //servidor apontando que iniciou o reconhecimento de voz do audio enviado
				validateStartOfSpeech(arrValues);
				break;
			case WS_RESPONSES.END_OF_SPEECH: //resposta para apontar que foi identificado silencio e que portanto parou-se de realizar o reconhecimento
				validateEndOfSpeech(arrValues);
				break;
			case WS_RESPONSES.END_OF_SPEECH: //resposta para apontar que foi identificado silencio e que portanto parou-se de realizar o reconhecimento
				validateEndOfSpeech(arrValues);
				break;
		}


	});


}

function startRecognition() {
	var body = GRAMMAR_LM[0]; //atualmente apenas uma gramatica é permitida
	//body += "ConfidenceThreshold: " + CONFIDENCE_THRESHOLD + ENTER;
	//body += "MaxSentences: " + MAX_SENTENCE + ENTER;
	//body += "NoInputTimeout: " + NO_INPUT_TIMEOUT + ENTER;
	//body += "RecognitionTimeout: " + RECOGNITION_TIMEOUT + ENTER;
	//body += "TimerEnabled: " + TIMER_ENABLED + ENTER;

	var item = PRODUCT + " " + VERSION + " " + WS_COMMANDS.START_RECOGNITION + ENTER;
	item += "Content-Length: " + body.length + ENTER;
	item += "Content-Type: text/uri-list" + ENTER + ENTER;
	item += body;

	ws.send(toUTF8Array(item));
}

function send(data) {
	if (this.state != READY) {

		winston.error("ASR Client is not ready");
		return;
	}
	var item = PRODUCT + " " + VERSION + " " + WS_COMMANDS.SEND_AUDIO + ENTER;
	item += "LastPacket: " + (data.length < 65536) + ENTER;
	item += "Content-Length: " + data.length + ENTER;
	item += "Content-Type: application/octet-stream" + ENTER + ENTER;
	console.log(item);
	let buffer = [];
	buffer.push(toUTF8ArrayBuffer(item));
	buffer.push(data);

	buffers.push(data);
	buffer = Buffer.concat(buffer);

	requestNumber++;
	ws.send(buffer);
}

module.exports = ASRClient;