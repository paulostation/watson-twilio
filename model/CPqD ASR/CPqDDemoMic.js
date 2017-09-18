var canvasContext;
var WIDTH = 30;
var HEIGHT = 300;

var configMicASRClient = {}
configMicASRClient.onFinalResult = function (objResult) { //evento disparado quando um resultado (parcial ou não) de reconhecimento é fornecido pelo servidor
    //console.log("resultado final");
	if (objResult.getSentenceText(0) != undefined) {
		$("#trans").val(objResult.getSentenceText(0));
        $("#sema").val(objResult.getInterpretation(0));
	} else {
		$("#trans").val("[ [ NO_MATCH ] ]");
		$("#sema").val("");
	}
    if ($("#action").length > 0) {
        $("#action").val(objResult.getSlot(0, "action"));
        $("#from_account_type").val(objResult.getSlot(0, "from_account_type"));
        $("#to_account_type").val(objResult.getSlot(0, "to_account_type"));
        if (objResult.getSlot(0, "money") != undefined) {
        	$("#amount").val(Number(objResult.getSlot(0, "money")).toFixed(2));
        } else {
        	$("#amount").val("");
        }
        $("#doc").val(objResult.getSlot(0, "pay_what"));
        $("#date").val(objResult.getSlot(0, "date"));
    }
    $("#score").text(objResult.getScore(0));
    $("#trans").css('color', 'black');
    $("#div-round-button-circle").removeClass('green-circle');
    $("#div-round-button-circle").removeClass('grey-circle');
    $("#helpText").text('Clique para começar a falar');
};
configMicASRClient.onPartialResult = function (objResult) { //evento disparado quando um resultado (parcial ou não) de reconhecimento é fornecido pelo servidor
    //console.log("resultado parcial");
    $("#trans").val(objResult.getSentenceText(0));
    $("#trans").css('color', 'lightgrey');
};
configMicASRClient.onError = function (e, data) {
    errorOcurred = true;
    console.log(data);
    switch (e) {
        case ERROR_CODES.CLIENT:
            break;
        case ERROR_CODES.SERVER:
            break;
        case ERROR_CODES.NETWORK:
            break;
    }
};
configMicASRClient.onWarning = function (data) {
    console.log(data);
};
configMicASRClient.onOpen = function () {
    $("#div-round-button-circle").removeClass('green-circle');
    $("#div-round-button-circle").removeClass('grey-circle');
    $("#helpText").text('Clique para começar a falar');
};
configMicASRClient.onClose = function () {
    $("#div-round-button-circle").removeClass('green-circle');
    $("#div-round-button-circle").addClass('grey-circle');
    $("#helpText").text('Aguardando conexão....');
    var r = confirm("Sua conexão foi fechada. Deseja Reconectar-se?");
    cpqdMicASRClient.stopListening();

    if (r == true) {
        conectar();

    } else {
        $("#helpText").text('Conexão perdida. Por favor, recarregue a página');

    }
};

configMicASRClient.recorderWorkerPath = "/javascripts/recorderWorker.js";

var cpqdMicASRClient;
conectar();

function conectar() {
    cpqdMicASRClient = new CPqDMicASRClient(configMicASRClient);
    cpqdMicASRClient.open('ws://9.18.180.254:8025/asr-server/asr');
    // cpqdMicASRClient.open('wss://' + getCookie("usrname") + ':' + getCookie("psw") + '@speech.cpqd.com.br/asr/spider');
    
    canvasContext = $('#meter')[0].getContext("2d");
    drawLoop();
}
