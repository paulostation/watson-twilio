let WS_CONSTANTS = require("./CPqDConstants.js");


var CPqDASRClient = function (cfg) {
	var config = cfg || {};

	var PRODUCT = "ASR";
	var VERSION = "2.0";
	var CHANNELS = "1"; //1- mono 2- stereo
	var SELECTED_ENCODING = ENCODING_TYPES.PCM_SIGNED;
	var SAMPLE_RATE = "16.0";
	var SAMPLE_SIZE_IN_BITS = "16";
	var CONFIDENCE_THRESHOLD = 30; // Valores de 0 a 100
	var MAX_SENTENCE = 5; // valores de 1 a 5
	var NO_INPUT_TIMEOUT = 3000; // Tempo de finalização por silencio em milis
	var RECOGNITION_TIMEOUT = 3000; // Tempo máximo de reconhecimento de fala
	var TIMER_ENABLED = true; // Timer de reconhecimento deve ser utilizado
	var GRAMMAR_LM = ["ptbr-16k-1.0.0/slm/general"]; // lista de gramaticas a serem utilizadas no reconhecimento
	var serverStatus = SESSION_STATUS.OFFLINE;

	//#################### Inicio das configurações do WebSocket ##############################

	var configWebSocket = {};
	configWebSocket.onOpen = function () {
		//deve-se criar a sessão neste ponto
		startSession();
		config.onOpen();
	};
	configWebSocket.onWarning = function (strData) {
		config.onWarning(strData);
	};
	configWebSocket.onError = function (e, strData) {
		config.onError(e, strData);
	};
	configWebSocket.onClose = function () {
		config.onClose();
	};
	configWebSocket.onMessage = function (strData) {
		console.log(strData);
		identifyResponse(strData);
	};
	var cpqdWebSocket = new CPqDWebSocket(configWebSocket);

	config.onError = config.onError || function (e, strData) { }; //a ser disparado quando ocorrer erro
	config.onWarning = config.onWarning || function (strData) {
	}; //a ser disparado quando há algum aviso
	config.onSessionCreated = config.onSessionCreated || function () { }; //a ser disparado quando o servidor apontar que aceitou o comando de session_create
	config.onListening = config.onListening || function () { }; //a ser disparado quando o servidor apontar que aceitou o comando de session_create
	config.onOpen = config.onOpen || function () { }; //a ser disparado quando o servidor apontar que aceitou o comando de session_create
	//config.onRecognitionStopped = config.onRecognitionStopped || function () { }; //a ser disparado quando o servidor apontar que aceitou o comando de session_create
	//config.onReadyForSpeech = config.onReadyForSpeech || function () { }; //a ser disparado quando tudo estiver pronto para receber fala
	//config.onEndOfSession = config.onEndOfSession || function () { }; //a ser disparado quando ocorrer um fim de sessão
	config.onFinalResult = config.onFinalResult || function (data) { }; //ser disparado sempre que o servidor enviar o resultado de um reconhecimento final
	config.onPartialResult = config.onPartialResult || function (data) { }; //ser disparado sempre que o servidor enviar o resultado de um reconhecimento parcial
	//config.onEndOfSpeech = config.onEndOfSpeech || function () { };  //a ser disparado ao final de fala

	//#################### Fim das configurações do WebSocket ##############################

	//#################### Métodos públicos ################################################

	this.open = function (server) {
		cpqdWebSocket.connect(server);
	};

	this.close = function (server) {
		cpqdWebSocket.disconnect();
	};

	//retorna se o Servidor ASR está com a sessão criada
	this.isSessionCreated = function () {
		return (serverStatus == WS_CONSTANTS.SESSION_STATUS.CONNECTED || WS_CONSTANTS.SESSION_STATUS.IDLE || serverStatus == WS_CONSTANTS.SESSION_STATUS.LISTENING || serverStatus == WS_CONSTANTS.SESSION_STATUS.RECOGNIZING);
	};

	//retorna se o Servidor ASR está aguardando pacotes de audio
	this.isListening = function () {
		//console.log("CPqDASRClient - isListening()");
		//console.log(serverStatus == SESSION_STATUS.LISTENING);
		//console.log(serverStatus == RESULT_STATUS.PROCESSING);
		//console.log(serverStatus == SESSION_STATUS.LISTENING || serverStatus == RESULT_STATUS.PROCESSING);

		return (serverStatus == WS_CONSTANTS.SESSION_STATUS.LISTENING || serverStatus == WS_CONSTANTS.RESULT_STATUS.PROCESSING);
	};

	//retorna se 
	this.isConnected = function () {
		return (cpqdWebSocket.isConnected());
	};
	var audioFile = new Blob();

	//######################################################################################

	var MyBlobBuilder = function () {
		this.parts = [];
	};

	MyBlobBuilder.prototype.append = function (part) {
		this.parts.push(part);
		this.blob = undefined; // Invalidate the blob
	};

	MyBlobBuilder.prototype.getBlob = function () {
		if (!this.blob) {
			this.blob = new Blob(this.parts);
		}
		return this.blob;
	};

	var myBlobBuilder = new MyBlobBuilder();
	//######################################################################################

	//envia trecho de audio para o servidor seguindo protocolo
	this.sendAudioPacket = function (audio, lastPacket) {
		//myBlobBuilder.append(audio);
		//audioFile = new Blob([audioFile, audio]);
		//console.log(audioFile.size);
		//if (lastPacket)
		//    saveTextAsFile1("teste.wav", myBlobBuilder.getBlob());
		//saveTextAsFile1("teste.wav", audio);

		var item = PRODUCT + " " + VERSION + " " + WS_CONSTANTS.WS_COMMANDS.SEND_AUDIO + WS_CONSTANTS.ENTER;
		item += "LastPacket: " + lastPacket + WS_CONSTANTS.ENTER;
		item += "Content-Length: " + audio.size + WS_CONSTANTS.ENTER;
		item += "Content-Type: application/octet-stream" + WS_CONSTANTS.ENTER + WS_CONSTANTS.ENTER;
		//console.log(item);
		var bTemp = new Blob([convert.str2blob(item), audio], { type: "application/octet-stream" });

		cpqdWebSocket.sendMessage(bTemp);
	};

	this.createSession = function () {
		startSession();
	};

	this.startRecognition = function (strArrayGrammars) {
		GRAMMAR_LM = strArrayGrammars || GRAMMAR_LM;
		startRecognition(GRAMMAR_LM);
	};

	this.cancelRecognition = function () {
		cancelRecognition();
	};

	//#################### Fim dos Métodos Públicos ##############################

	//#################### Inicio dos Métodos Privados ##############################


	//#################### Inicio comandos ASR ##############################

	// Cria a sessão para acessar o ASR
	function startSession() {
		var item = PRODUCT + " " + VERSION + " " + WS_CONSTANTS.WS_COMMANDS.CREATE_SESSION + WS_CONSTANTS.ENTER;
		item += "Channels: " + CHANNELS + WS_CONSTANTS.ENTER;
		item += "Encoding: " + SELECTED_ENCODING + WS_CONSTANTS.ENTER;
		item += "SampleRate: " + SAMPLE_RATE + WS_CONSTANTS.ENTER;
		item += "SampleSizeInBits: " + SAMPLE_SIZE_IN_BITS + WS_CONSTANTS.ENTER;

		cpqdWebSocket.sendMessage(item);
	}

	//solicita/informa o servidor ASR de que se deseja realizar o reconhecimento de um buffer
	function startRecognition(strArrayGrammars) {
		var body = GRAMMAR_LM[0]; //atualmente apenas uma gramatica é permitida
		//body += "ConfidenceThreshold: " + CONFIDENCE_THRESHOLD + ENTER;
		//body += "MaxSentences: " + MAX_SENTENCE + ENTER;
		//body += "NoInputTimeout: " + NO_INPUT_TIMEOUT + ENTER;
		//body += "RecognitionTimeout: " + RECOGNITION_TIMEOUT + ENTER;
		//body += "TimerEnabled: " + TIMER_ENABLED + ENTER;

		var item = PRODUCT + " " + VERSION + " " + WS_CONSTANTS.WS_COMMANDS.START_RECOGNITION + WS_CONSTANTS.ENTER;
		item += "Content-Length: " + body.length + WS_CONSTANTS.ENTER;
		item += "Content-Type: text/uri-list" + WS_CONSTANTS.ENTER + WS_CONSTANTS.ENTER;
		item += body;

		cpqdWebSocket.sendMessage(item);
	}

	//solicita/informa o servidor ASR de que se deseja interromper o processo de reconhecimento 
	function cancelRecognition() {
		var item = PRODUCT + " " + VERSION + " " + WS_CONSTANTS.WS_COMMANDS.CANCEL_RECOGNITION + WS_CONSTANTS.ENTER;
		cpqdWebSocket.sendMessage(item);
	}

	//libera a sessão no servidor ASR
	function releaseSession() {
		var item = PRODUCT + " " + VERSION + " " + WS_CONSTANTS.WS_COMMANDS.RELEASE_SESSION + WS_CONSTANTS.ENTER;
		cpqdWebSocket.sendMessage(item);
	}

	//identifica uma resposta do servidor segundo especificação do protocolo de comunicação estabelecido
	function identifyResponse(strValue) {
		var arrValues = strValue.split(WS_CONSTANTS.ENTER);
		var strResponse = getResponse(arrValues);

		switch (strResponse) {
		case WS_CONSTANTS.WS_RESPONSES.RESPONSE: //respostas gerais do servidor
			validateResponse(arrValues);
			break;
		case WS_CONSTANTS.WS_RESPONSES.RECOGNITION_RESULT: //resposta de reconhecimento de fala
			validateRecognitionResult(arrValues);
			break;
		case WS_CONSTANTS.WS_RESPONSES.START_OF_SPEECH: //servidor apontando que iniciou o reconhecimento de voz do audio enviado
			validateStartOfSpeech(arrValues);
			break;
		case WS_CONSTANTS.WS_RESPONSES.END_OF_SPEECH: //resposta para apontar que foi identificado silencio e que portanto parou-se de realizar o reconhecimento
			validateEndOfSpeech(arrValues);
			break;
		case WS_CONSTANTS.WS_RESPONSES.END_OF_SPEECH: //resposta para apontar que foi identificado silencio e que portanto parou-se de realizar o reconhecimento
			validateEndOfSpeech(arrValues);
			break;
		}
	}

	//trata um objeto Response vindo do servidor
	function validateResponse(arrValues) {
		var objResponse = prepareResponse(arrValues);
		if (isResponseSuccessfull(objResponse.result)) {
			switch (objResponse.method) {
			case WS_CONSTANTS.WS_COMMANDS.CREATE_SESSION:
				config.onSessionCreated();
				break;
			case WS_CONSTANTS.WS_COMMANDS.START_RECOGNITION:
				config.onListening();
				break;
			case WS_CONSTANTS.WS_COMMANDS.SEND_AUDIO:
				break;
			case WS_CONSTANTS.WS_COMMANDS.CANCEL_RECOGNITION:
				config.onRecognitionStopped();
				break;
			case WS_CONSTANTS.WS_COMMANDS.RELEASE_SESSION:
				break;
			case WS_CONSTANTS.WS_COMMANDS.GET_SESSION_STATUS:
				break;
			}
		}
		else {
			//   cpqdWebSocket.disconnect();
		}
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

	//despreza o cabeçalho presente nas mensagens vindas do servidor e retorna o restante
	function getResponse(arrValues) {
		var value = arrValues[0];
		return value.substring(value.lastIndexOf(" ") + 1);
	}

	//converte o array fornecido em um objeto to Tipo Response, que é um dos tipos possíveis de reposta do servidor descrita pelo Protocolo
	function prepareResponse(arrValues) {
		var objResponse = new Response();
		$(arrValues).each(function (index, value) {
			if (value.indexOf("Session-Status: ") != -1) {
				objResponse.status = value.replace("Session-Status: ", "");
				serverStatus = objResponse.status; //atualiza a informação de status do servidor localmente
				// console.log("serverStatus prepareResponse = " + serverStatus);
			}
			if (value.indexOf("Method: ") != -1)
				objResponse.method = value.replace("Method: ", "");
			if (value.indexOf("Result: ") != -1)
				objResponse.result = value.replace("Result: ", "");
		});
		return objResponse;
	}

	//converte o array fornecido em um objeto to Tipo RecognitionResult, que é um dos tipos possíveis de reposta do servidor descrita pelo Protocolo
	function prepareRecognitionResult(arrValues) {
		var objRecognitionResult = new RecognitionResult();
		$(arrValues).each(function (index, value) {
			//if (value.indexOf("Handle: ") != -1)
			//    objRecognitionResult.handle = value.replace("Handle: ", "");
			if (value.indexOf("Result-Status: ") != -1) { //especificamente no retorno de resultado de reconhecimento, o status do servidor vem na tag RESULT e não na tag STATUS
				objRecognitionResult.result = value.replace("Result-Status: ", "");
				serverStatus = objRecognitionResult.result; //atualiza a informação de status do servidor localmente
				// console.log("serverStatus prepareRecognitionResult = " + serverStatus);
			}
			if (value.indexOf("[{") != -1) { //json contendo as sentencas identificadas
				objRecognitionResult.setSentences(value);
			}
		});
		return objRecognitionResult;
	}

	//converte o array fornecido em um objeto to Tipo OfSpeech(start ou end), que é um dos tipos possíveis de reposta do servidor descrita pelo Protocolo
	function prepareOfSpeech(arrValues) {
		var objOfSpeech = new OfSpeech();
		$(arrValues).each(function (index, value) {
			if (value.indexOf("Handle: ") != -1)
				objOfSpeech.handle = value.replace("Handle: ", "");
			if (value.indexOf("Session-Status: ") != -1) {
				objOfSpeech.status = value.replace("Session-Status: ", "");
				serverStatus = objOfSpeech.status; //atualiza a informação de status do servidor localmente
				//  console.log("serverStatus prepareOfSpeech = " + serverStatus);

			}
		});
		return objOfSpeech;
	}

	//Verifica se o valor retornado retornou sucesso
	function isResponseSuccessfull(value) {
		return value == WS_RESPONSE_RESULTS.SUCCESS;
	}

	//#################### Fim comandos ASR ##############################

	//método auxiliar para salvar o buffer do audio em arquivo e com isso viabilizar depuração.
	function saveTextAsFile1(nameFile, blob) {
		var textFileAsBlob = blob;
		var fileNameToSaveAs = nameFile;

		var downloadLink = document.createElement("a");
		downloadLink.download = fileNameToSaveAs;
		downloadLink.innerHTML = "Baixar arquivo";
		if (window.webkitURL != null) {
			// Para webkit
			downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
		}
		else {
			// Para o Firefox
			downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
			downloadLink.onclick = destroyClickedElement;
			downloadLink.style.display = "none";
			document.body.appendChild(downloadLink);
		}

		downloadLink.click();
	}
};

window.CPqDASRClient = CPqDASRClient;
