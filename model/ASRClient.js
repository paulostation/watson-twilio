const WebSocketClient = require('websocket').client,
	winston = require("../bin/logger.js");

let WS_COMMANDS = {
	CREATE_SESSION: "CREATE_SESSION",
	START_RECOGNITION: "START_RECOGNITION",
	SEND_AUDIO: "SEND_AUDIO",
	CANCEL_RECOGNITION: "CANCEL_RECOGNITION",
	RELEASE_SESSION: "RELEASE_SESSION",
	GET_SESSION_STATUS: "GET_SESSION_STATUS"
};

let ENCODING_TYPES = {
	ALAW: "ALAW", //ainda não suportado pelo servidor
	PCM_FLOAT: "PCM_FLOAT", //ainda não suportado pelo servidor
	PCM_SIGNED: "PCM_SIGNED",
	PCM_UNSIGNED: "PCM_UNSIGNED", //ainda não suportado pelo servidor
	ULAW: "ULAW" // ainda não suportado pelo servidor 
};

var PRODUCT = "ASR"
var VERSION = "2.1"
var CHANNELS = "1"; //1- mono 2- stereo
var SELECTED_ENCODING = ENCODING_TYPES.PCM_SIGNED;
var SAMPLE_RATE = "8.0";
var SAMPLE_SIZE_IN_BITS = "16";
// var CONFIDENCE_THRESHOLD = 30; // Valores de 0 a 100
// var MAX_SENTENCE = 5; // valores de 1 a 5
// var NO_INPUT_TIMEOUT = 3000 // Tempo de finalização por silencio em milis
// var RECOGNITION_TIMEOUT = 3000; // Tempo máximo de reconhecimento de fala
// var TIMER_ENABLED = true; // Timer de reconhecimento deve ser utilizado
// var GRAMMAR_LM = ["ptbr-16k-1.0.0/slm/general"]; // lista de gramaticas a serem utilizadas no reconhecimento
// var serverStatus = SESSION_STATUS.OFFLINE;
var ENTER = "\r\n";

function toUTF8Array(str) {
	var utf8 = [];
	for (var i = 0; i < str.length; i++) {
		var charcode = str.charCodeAt(i);
		if (charcode < 0x80) utf8.push(charcode);
		else if (charcode < 0x800) {
			utf8.push(0xc0 | (charcode >> 6),
				0x80 | (charcode & 0x3f));
		}
		else if (charcode < 0xd800 || charcode >= 0xe000) {
			utf8.push(0xe0 | (charcode >> 12),
				0x80 | ((charcode >> 6) & 0x3f),
				0x80 | (charcode & 0x3f));
		}
		// surrogate pair
		else {
			i++;
			// UTF-16 encodes 0x10000-0x10FFFF by
			// subtracting 0x10000 and splitting the
			// 20 bits of 0x0-0xFFFFF into two halves
			charcode = 0x10000 + (((charcode & 0x3ff) << 10)
				| (str.charCodeAt(i) & 0x3ff));
			utf8.push(0xf0 | (charcode >> 18),
				0x80 | ((charcode >> 12) & 0x3f),
				0x80 | ((charcode >> 6) & 0x3f),
				0x80 | (charcode & 0x3f));
		}
	}
	return utf8;
}

const WebSocket = require('ws');

const ws = new WebSocket('ws://9.18.180.254:8025/asr-server/asr');

ws.on('open', function open() {

	var item = PRODUCT + " " + VERSION + " " + WS_COMMANDS.CREATE_SESSION + ENTER;
	item += "Channels: " + CHANNELS + ENTER;
	item += "Encoding: " + SELECTED_ENCODING + ENTER;
	item += "SampleRate: " + SAMPLE_RATE + ENTER;
	item += "SampleSizeInBits: " + SAMPLE_SIZE_IN_BITS + ENTER;

	ws.send(toUTF8Array(item), function ack(error) {
		
		winston.error(error);
	});
});

ws.on('message', function incoming(data) {
	console.log(data.toString());
});

ws.on("error", error => {
	console.error(error);
})
