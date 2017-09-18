(function (window) {

	var CPqDMicASRClient = function (cfg) {
		var config = cfg || {};
		var cancelled = false; //flag de controle de interrupção de transmissão de arquivos.
		var lastPacket = false;
		var micReady = false;
		var initTries = 0;
		var initMaxTries = 40; //  40 * 250 mils = 10 segs
		var intervalTriesKey; //objeto timer para inicializar o microfone


		//#################### inicializações ################################

		var configMicrophone = {};
		configMicrophone.recorderWorkerPath = config.recorderWorkerPath || RECORDER_WORKER_PATH;
		configMicrophone.onWarning = function (data) { console.log(data); };
		configMicrophone.onError = function (e, data) {
			errorOcurred = true;
			cpqdMic.stopListening();
			console.log(data);
			switch (e) {
			case ERROR_CODES.AUDIO:
				$("#div-round-button-circle").addClass("grey-circle");
				$("#helpText").text("Houve um problema ao utilizar o microfone");
				break;
			}
		};
		configMicrophone.onDataCaptured = function (data) {
          
			if (cpqdASRClient.isListening()) {
				//  console.log('cpqddemo - datacaptured');
				cpqdASRClient.sendAudioPacket(data, lastPacket);
				if (lastPacket)
					cpqdMic.stopListening();

			}
			//  else
			// console.log('recebeu dados do microfone mas não enviou pois nao está listening');
            
		};
		configMicrophone.onInit = function () { //evento disparado quando o microfone foi inicializado corretamente e está pronto para iniciar uma gravação
			//  console.log('mic is ready');
			errorOcurred = false;
			micReady = true;
		};
		cpqdMic = new CPqDMic(configMicrophone);

		var configASR = {};
		configASR.onOpen = function () {
			console.log("CPqDMicASRClient - onOpen");
			config.onOpen();
		};
		configASR.onWarning = function (strData) {
			config.onWarning(strData);
		};
		configASR.onError = function (e, strData) {
			config.onError(e, strData);
		};
		configASR.onClose = function () {
			config.onClose();
		};
		configASR.onListening = function () {
			console.log("servidor pronto para receber dados do microfone");
			//iniciar o envio dos dados represados do microfone
			cpqdMic.startRecording();
		};
		configASR.onSessionCreated = function () {
			config.onOpen();
		};

		configASR.onFinalResult = function (alternatives) {
			config.onFinalResult(alternatives);
			//NONE: "NONE",
			//PROCESSING: "PROCESSING",
			//RECOGNIZED: "RECOGNIZED", // quando ocorre um resultado de reconhecimento
			//NO_MATCH: "NO_MATCH", //não foi possível reconhecer o audio fornecido
			//NO_INPUT_TIMEOUT: "NO_INPUT_TIMEOUT", // o audio fornecido apresentou grande porção de silencio ou não-fala
			//MAX_SPEECH: "MAX_SPEECH",
			//EARLY_SPEECH: "EARLY_SPEECH",
			//RECOGNITION_TIMEOUT: "RECOGNITION_TIMEOUT",
			//NO_SPEECH: "NO_SPEECH", //não foi possível reconhecer o audio fornecido
			//CANCELED: "CANCELED", //não foi possível reconhecer o audio fornecido
			//FAILURE: "FAILURE"


			if ([RESULT_STATUS.RECOGNIZED, RESULT_STATUS.NO_MATCH, RESULT_STATUS.NO_INPUT_TIMEOUT, RESULT_STATUS.MAX_SPEECH, RESULT_STATUS.EARLY_SPEECH, RESULT_STATUS.RECOGNITION_TIMEOUT, RESULT_STATUS.NO_SPEECH, RESULT_STATUS.CANCELED, RESULT_STATUS.FAILURE].indexOf(alternatives.result) != -1) 
			{
				cpqdMic.stopListening();
			}
           
		};
		configASR.onPartialResult = function (alternatives) {
			config.onPartialResult(alternatives);

			if ([RESULT_STATUS.RECOGNIZED, RESULT_STATUS.NO_MATCH, RESULT_STATUS.NO_INPUT_TIMEOUT, RESULT_STATUS.MAX_SPEECH, RESULT_STATUS.EARLY_SPEECH, RESULT_STATUS.RECOGNITION_TIMEOUT, RESULT_STATUS.NO_SPEECH, RESULT_STATUS.CANCELED, RESULT_STATUS.FAILURE].indexOf(alternatives.result) != -1) {
				cpqdMic.stopListening();
			}
		};

		var cpqdASRClient = new CPqDASRClient(configASR);

		config.onError = config.onError || function (e, data) { }; //a ser disparado quando ocorrer erro
		config.onOpen = config.onOpen || function () { }; //a ser disparado quando o servidor apontar que aceitou o comando de session_create
		config.onClose = config.onClose || function () { };
		config.onWarning = config.onWarning || function (data) { }; //a ser disparado quando ocorrer um fim de sessão
		config.onFinalResult = config.onFinalResult || function (data) { }; //a ser disparado quando ocorrer um fim de sessão
		config.onPartialResult = config.onPartialResult || function (data) { }; //a ser disparado quando ocorrer um fim de sessão

		//#################### Fim das Inicializações ##############################


		//#################### Métodos públicos ################################################

		this.volume = function () {
			return cpqdMic.volume();
		};

		this.clipping = function () {
			return cpqdMic.clipping();
		};

		//retorna se o Servidor ASR está com a sessão criada
		this.isListening = function () {
			console.log("CPqDMicASRClient - isListening()");
			CPqDASRClient.isListening();

		};

		this.isConnected = function () {
			return (CPqDASRClient.isConnected());
		};

		this.open = function (server) {
			if (micReady)
			{
				cpqdASRClient.open(server);
			}
			else
			{
				intervalTriesKey = setInterval(function () {
					if (initTries > initMaxTries)//reportar erro e desistir por timeout
					{
						config.onError(ERROR_CODES.CLIENT,"Não foi possível inicializar o microfone.");
						clearInterval(intervalTriesKey);
					}
					if (micReady) {
						cpqdASRClient.open(server);
						clearInterval(intervalTriesKey);
					}
					else
					{
						initTries++;
					}
				}, 250);
			}
            
		};

		this.close = function () {
			cpqdASRClient.close();
		};

		//solicita/informa o servidor ASR de que se deseja interromper o processo de reconhecimento 
		this.cancelRecognition = function () {
			cancelled = true; //flag de controle de interrupção

			cpqdASRClient.cancelRecognition();
		};

		//solicita/informa o servidor ASR de que se deseja interromper o processo de reconhecimento 
		this.stopListening = function () {
			lastPacket = true; //flag de controle de interrupção

			//   cpqdMic.stopListening();
		};


		//solicita/informa o servidor ASR de que se deseja realizar o reconhecimento de um buffer
		this.recognize = function (strArrayGrammar) {
			//enviar arquivo por arquivo em chunks

			//iniciar a gravação do microfone
			lastPacket = false; //flag de controle de interrupção

			cpqdASRClient.startRecognition(strArrayGrammar);
		};

		//#################### Fim dos Métodos Públicos ##############################

		//#################### Inicio dos Métodos Privados ##############################

	}; 

	window.CPqDMicASRClient = CPqDMicASRClient;

})(window);
