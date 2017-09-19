const ASRconstants = require("./CPqDASRConstants"),
	winston = require("../bin/logger.js");

//despreza o cabeçalho presente nas mensagens vindas do servidor e retorna o restante
function getResponse(arrValues) {
	var value = arrValues[0];
	return value.substring(value.lastIndexOf(" ") + 1);
}

//Verifica se o valor retornado retornou sucesso
function isResponseSuccessfull(value) {
	return value == ASRconstants.WS_RESPONSE_RESULTS.SUCCESS;
}

//converte o array fornecido em um objeto to Tipo Response, que é um dos tipos possíveis de reposta do servidor descrita pelo Protocolo
function prepareResponse(arrValues) {

	var objResponse = {};

	arrValues.forEach(function (value, index) {
		if (value.indexOf("Session-Status: ") != -1) {
			objResponse.status = value.replace("Session-Status: ", "");

			// console.log("serverStatus prepareResponse = " + serverStatus);
		}
		if (value.indexOf("Method: ") != -1)
			objResponse.method = value.replace("Method: ", "");
		if (value.indexOf("Result: ") != -1)
			objResponse.result = value.replace("Result: ", "");
		if (value.indexOf("Result-Status: ") != -1)
			objResponse.resultStatus = value.replace("Result-Status: ", "");
	});
	return objResponse;
}

//converte o array fornecido em um objeto to Tipo RecognitionResult, que é um dos tipos possíveis de reposta do servidor descrita pelo Protocolo
function prepareRecognitionResult(arrValues) {

	var objRecognitionResult = {};

	arrValues.forEach(function (value) {
		//if (value.indexOf("Handle: ") != -1)
		//    objRecognitionResult.handle = value.replace("Handle: ", "");
		if (value.indexOf("Result-Status: ") != -1) { //especificamente no retorno de resultado de reconhecimento, o status do servidor vem na tag RESULT e não na tag STATUS
			objRecognitionResult.result = value.replace("Result-Status: ", "");

		}
		if (value.indexOf("[{") != -1) { //json contendo as sentencas identificadas

			objRecognitionResult.jsonResponse = value;
			console.log(value);
		}
	});
	return objRecognitionResult;
}

//trata um objeto Response vindo do servidor
function validateResponse(arrValues) {
	return new Promise((resolve, reject) => {


		var objResponse = prepareResponse(arrValues);

		if (isResponseSuccessfull(objResponse.result)) {
			switch (objResponse.method) {
				case ASRconstants.WS_COMMANDS.CREATE_SESSION:
					resolve(true);
					break;
				case ASRconstants.WS_COMMANDS.START_RECOGNITION:
					resolve(true);
					break;
				case ASRconstants.WS_COMMANDS.SEND_AUDIO:
					this.emit("validResponse");
					break;
				case ASRconstants.WS_COMMANDS.CANCEL_RECOGNITION:
					this.emit("validResponse");
					break;
				case ASRconstants.WS_COMMANDS.RELEASE_SESSION:
					this.emit("validResponse");
					break;
				case ASRconstants.WS_COMMANDS.GET_SESSION_STATUS:
					this.emit("validResponse");
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
	return new Promise((resolve, reject) => {

		var objRecognitionResult = prepareRecognitionResult(arrValue);
		if ([ASRconstants.RESULT_STATUS.NONE, ASRconstants.RESULT_STATUS.PROCESSING, ASRconstants.RESULT_STATUS.RECOGNIZED, ASRconstants.RESULT_STATUS.NO_MATCH, ASRconstants.RESULT_STATUS.NO_INPUT_TIMEOUT, ASRconstants.RESULT_STATUS.MAX_SPEECH, ASRconstants.RESULT_STATUS.EARLY_SPEECH, ASRconstants.RESULT_STATUS.RECOGNITION_TIMEOUT, ASRconstants.RESULT_STATUS.NO_SPEECH, ASRconstants.RESULT_STATUS.CANCELED, ASRconstants.RESULT_STATUS.FAILURE].indexOf(objRecognitionResult.result) != -1) {
			if (objRecognitionResult.result == ASRconstants.RESULT_STATUS.PROCESSING) {
				// config.onPartialResult(objRecognitionResult);
			}
			else {
				//console.log("$$$$ considerando FINAL -> " + RESULT_STATUS);
				resolve(objRecognitionResult);
			}

			if ([ASRconstants.RESULT_STATUS.RECOGNIZED, ASRconstants.RESULT_STATUS.NO_MATCH, ASRconstants.RESULT_STATUS.NO_INPUT_TIMEOUT, ASRconstants.RESULT_STATUS.MAX_SPEECH, ASRconstants.RESULT_STATUS.EARLY_SPEECH, ASRconstants.RESULT_STATUS.RECOGNITION_TIMEOUT, ASRconstants.RESULT_STATUS.NO_SPEECH, ASRconstants.RESULT_STATUS.CANCELED, ASRconstants.RESULT_STATUS.FAILURE].indexOf(objRecognitionResult.result) != -1) {
				reject(new Error(objRecognitionResult.result));
			}
		}
	});
}

//trata um objeto validateStartOfSpeech vindo do servidor
function validateStartOfSpeech(arrValue) {
	var objOfSpeech = prepareOfSpeech(arrValue);
	if (ASRconstants.SESSION_STATUS.LISTENING != objOfSpeech.result) {

	}
}

//trata um objeto validateEndOfSpeech vindo do servidor
function validateEndOfSpeech(arrValue) {
	return new Promise((resolve, reject) => {


		var objOfSpeech = prepareResponse(arrValue);

		if ([ASRconstants.SESSION_STATUS.PROCESSING, ASRconstants.SESSION_STATUS.RECOGNIZED].indexOf(objOfSpeech.resultStatus) != -1) {
			winston.silly("Speech recognized.");
			resolve(true);
		}

	});
}

function parseResponse(response) {

	return new Promise((resolve, reject) => {

		//identifica uma resposta do servidor segundo especificação do protocolo de comunicação estabelecido		
		var arrValues = response.split(ASRconstants.ENTER);
		var strResponse = getResponse(arrValues);

		switch (strResponse) {

			case ASRconstants.WS_RESPONSES.RESPONSE: //respostas gerais do servidor
				resolve(validateResponse(arrValues));
				break;
			case ASRconstants.WS_RESPONSES.RECOGNITION_RESULT: //resposta de reconhecimento de fala
				resolve(validateRecognitionResult(arrValues));
				break;
			case ASRconstants.WS_RESPONSES.START_OF_SPEECH: //servidor apontando que iniciou o reconhecimento de voz do audio enviado
				resolve(validateStartOfSpeech(arrValues));
				break;
			case ASRconstants.WS_RESPONSES.END_OF_SPEECH: //resposta para apontar que foi identificado silencio e que portanto parou-se de realizar o reconhecimento
				resolve(validateEndOfSpeech(arrValues));
				break;
			default:
				reject(new Error("Invalid response from ASR Server: ", strResponse));
				break;
		}

	});
}

module.exports = {
	parseResponse: parseResponse
};