module.exports.STATE = {
	SESSION_NOT_CREATED: 0,
	READY: 1,
	RECOGNITION_STARTED: 2,
	RECOGNIZING: 3
};
module.exports.WS_COMMANDS = {
	CREATE_SESSION: "CREATE_SESSION",
	START_RECOGNITION: "START_RECOGNITION",
	SEND_AUDIO: "SEND_AUDIO",
	CANCEL_RECOGNITION: "CANCEL_RECOGNITION",
	RELEASE_SESSION: "RELEASE_SESSION",
	GET_SESSION_STATUS: "GET_SESSION_STATUS"
};

module.exports.WS_RESPONSES = {
	RESPONSE: "RESPONSE",
	RECOGNITION_RESULT: "RECOGNITION_RESULT",
	START_OF_SPEECH: "START_OF_SPEECH",
	END_OF_SPEECH: "END_OF_SPEECH"
};

module.exports.ENCODING_TYPES = {
	ALAW: "ALAW", //ainda não suportado pelo servidor
	PCM_FLOAT: "PCM_FLOAT", //ainda não suportado pelo servidor
	PCM_SIGNED: "PCM_SIGNED",
	PCM_UNSIGNED: "PCM_UNSIGNED", //ainda não suportado pelo servidor
	ULAW: "ULAW" // ainda não suportado pelo servidor 
};

module.exports.WS_RESPONSE_RESULTS = {
	SUCCESS: "SUCCESS",
	FAILURE: "FAILURE",
	INVALID_ACTION: "INVALID_ACTION"
};

module.exports.SESSION_STATUS = {
	CONNECTED: "CONNECTED",
	IDLE: "IDLE",
	LISTENING: "LISTENING",
	RECOGNIZING: "ASR_RECOGNIZING",
	OFFLINE: "OFFLINE" //status local apenas. para indicar que não há uma conexão com o servidor no momento
};

module.exports.RESULT_STATUS = {
	NONE: "NONE",
	PROCESSING: "PROCESSING",
	RECOGNIZED: "RECOGNIZED", // quando ocorre um resultado de reconhecimento
	NO_MATCH: "NO_MATCH", //não foi possível reconhecer o audio fornecido
	NO_INPUT_TIMEOUT: "NO_INPUT_TIMEOUT", // o audio fornecido apresentou grande porção de silencio ou não-fala
	MAX_SPEECH: "MAX_SPEECH",
	EARLY_SPEECH: "EARLY_SPEECH",
	RECOGNITION_TIMEOUT: "RECOGNITION_TIMEOUT",
	NO_SPEECH: "NO_SPEECH", //não foi possível reconhecer o audio fornecido
	CANCELED: "CANCELED", //não foi possível reconhecer o audio fornecido
	FAILURE: "FAILURE"
};

module.exports.PRODUCT = "ASR";
module.exports.VERSION = "2.1";
module.exports.CHANNELS = "1"; //1- mono 2- stereo
module.exports.SELECTED_ENCODING = module.exports.ENCODING_TYPES.PCM_SIGNED;
module.exports.SAMPLE_RATE = "8.0";
module.exports.SAMPLE_SIZE_IN_BITS = "16";
module.exports.GRAMMAR_LM = ["builtin:slm/general"];
// var CONFIDENCE_THRESHOLD = 30; // Valores de 0 a 100
// var MAX_SENTENCE = 5; // valores de 1 a 5
module.exports.NO_INPUT_TIMEOUT = 30000; // Tempo de finalização por silencio em milis
// var RECOGNITION_TIMEOUT = 3000; // Tempo máximo de reconhecimento de fala
// var TIMER_ENABLED = true; // Timer de reconhecimento deve ser utilizado
// var serverStatus = SESSION_STATUS.OFFLINE;
module.exports.ENTER = "\r\n";

