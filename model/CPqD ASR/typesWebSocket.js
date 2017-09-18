//Tipos e Constantes
window.ENTER = "\r\n";

window.Response = function () {
    this.handle;
    this.method;
    this.status;
    this.result;
    this.message;
}

window.OfSpeech = function () {
    this.handle;
    this.status;
}

window.RecognitionResult = function () {
    //this.handle;
    this.result;
    this.status;
    this.fullJSON;

    this.sentences = new Array();

    this.setSentences = function (fullJSON) {
        this.sentences = JSON.parse(fullJSON);
        this.fullJSON = fullJSON;
    }

    this.getSentenceText = function (index) {
    	if (this.sentences == null || this.sentences.alternatives == undefined || this.sentences.alternatives.length < 1) {
    		return;
    	}
    	return this.sentences.alternatives[index].text.trim();
    }

    this.getInterpretation = function (index) {
    	if (this.sentences == null || this.sentences.alternatives == undefined || this.sentences.alternatives.length < 1 || this.sentences.alternatives[index].interpretations == undefined || this.sentences.alternatives[index].interpretations.length < 1) {
    		return;
    	}
    	return JSON.stringify(this.sentences.alternatives[index].interpretations[0], null, '\t');
    }

    this.getSlot = function (index, name) {
    	if (this.sentences == null || this.sentences.alternatives == undefined || this.sentences.alternatives.length < 1) {
    		return;
    	}
    	return this.sentences.alternatives[index].interpretations[0][name];
    }

    this.getScore = function (index) {
    	if (this.sentences == null || this.sentences.alternatives == undefined || this.sentences.alternatives.length < 1) {
    		return "";
    	}
    	return this.sentences.alternatives[index].score;
    }

    this.getJson = function (index) {
    	return this.fullJSON;
    }
}

window.Sentence = function () {
    this.text;
    this.score;
    this.semanticText;
}

window.ENCODING_TYPES = {
    ALAW: "ALAW", //ainda não suportado pelo servidor
    PCM_FLOAT: "PCM_FLOAT", //ainda não suportado pelo servidor
    PCM_SIGNED: "PCM_SIGNED",
    PCM_UNSIGNED: "PCM_UNSIGNED", //ainda não suportado pelo servidor
    ULAW: "ULAW" // ainda não suportado pelo servidor 
};

window.WS_COMMANDS = {
    CREATE_SESSION: "CREATE_SESSION",
    START_RECOGNITION: "START_RECOGNITION",
    SEND_AUDIO: "SEND_AUDIO",
    CANCEL_RECOGNITION: "CANCEL_RECOGNITION",
    RELEASE_SESSION: "RELEASE_SESSION",
    GET_SESSION_STATUS: "GET_SESSION_STATUS"
};


window.WS_RESPONSES = {
    RESPONSE: "RESPONSE",
    RECOGNITION_RESULT: "RECOGNITION_RESULT",
    START_OF_SPEECH: "START_OF_SPEECH",
    END_OF_SPEECH: "END_OF_SPEECH"
};

window.WS_RESPONSE_RESULTS = {
    SUCCESS: "SUCCESS",
    FAILURE: "FAILURE",
    INVALID_ACTION: "INVALID_ACTION"
};

window.SESSION_STATUS = {
    CONNECTED: "CONNECTED",
    IDLE: "IDLE",
    LISTENING: "LISTENING",
    RECOGNIZING: "ASR_RECOGNIZING",
    OFFLINE: "OFFLINE" //status local apenas. para indicar que não há uma conexão com o servidor no momento
};

window.RESULT_STATUS = {
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

window.EVENT_CODES = {
    SEND: 5, //atuamente não está em uso
    SEND_EMPTY: 6, //atuamente não está em uso
    SEND_EOS: 7, //atuamente não está em uso
    WEB_SOCKET: 8,
    WEB_SOCKET_OPEN: 9,
    WEB_SOCKET_CLOSE: 10,
    STOP: 11,
    SERVER_CHANGED: 12 //atuamente não está em uso
};
