
var CPqDWebSocket = function (cfg) {
    var config = cfg || {};

    //#################### Inicio das configurações do WebSocket ##############################

    config.onOpen = config.onOpen || function () { }; //a ser disparado quando o servidor apontar que a conexão foi bem sucedida
    config.onError = config.onError || function (e, strData) { }; //a ser disparado quando ocorrer erro
    config.onWarning = config.onWarning || function (e, strData) { }; //a ser disparado quando ocorrer erro
    config.onMessage = config.onMessage || function (strData) { }; //ser disparado sempre que o servidor enviar uma mensagem
    config.onClose = config.onClose || function () { };  //a ser disparado quando o WebSocket encerrar a conexão

    var ws; //objeto WebSocket
    var serverStatus = SESSION_STATUS.OFFLINE; //Estado inicial do servidor ao instanciar o objeto CPqDAsr

    //#################### Fim das configurações do WebSocket ##############################

    //#################### Métodos públicos ################################################

    // retorna se a conexão está estabelecida 
    this.isConnected = function () {
        return (ws && serverStatus != SESSION_STATUS.OFFLINE)
    }

    // conecta ao servidor websocket
    this.connect = function (server) {

        if (this.isConnected()) {
            config.onWarning("O Servidor já está conectado. O comando foi ignorado");
            return;
        }

        try {
            ws = createWebSocket(server);
        } catch (e) {
            config.onError(ERROR_CODES.CLIENT, "O browser não suporta socket ou servidor informado é inválido");
        }
    }

    // desconecta o servidor WebSocket
    this.disconnect = function () {
        config.onWarning("método disconnect WebSocket");

        closeConnection();
    }

    //para enviar comandos ao servidor
    this.sendMessage = function (message) {
        if (ws) {
            var state = ws.readyState;
            if (state == 1) {
                if (message instanceof Blob) {
                    ws.send(message);
                }
                else {
                    console.log("ENVIO DE MENSAGEM")
                    console.log(message);
                    ws.send(convert.str2blob(message));
                }
            } else {
                config.onError(ERROR_CODES.NETWORK, 'WebSocket: readyState!=1: ' + state + ": falha no envio: " + message);
            }
        } else {
            config.onError(ERROR_CODES.CLIENT, 'WebSocket não estabelecido: falha no envio: ' + message);
        }
    }

    //#################### Fim dos Métodos Públicos ##############################

    //#################### Inicio dos Métodos Privados ##############################

    //criação do objeto websocket e configuração dos eventos pertinentes ao mesmo
    function createWebSocket(server) {

        var ws = new WebSocket(server);
        console.log('createWebSocket');

        // Evento disparado ao estabelecer uma conexão WebSocket
        ws.onopen = function (e) {
            serverStatus = SESSION_STATUS.CONNECTED;
            config.onOpen();
        };

        //Evento disparado ao receber uma mensagem
        ws.onmessage = function (e) {
            var data = e.data;
            var strData = convert.blob2str(data);
            config.onMessage(strData);
        }

        // Disparado quando a conexão WebSocket é fechada
        ws.onclose = function (e) {
            serverStatus = SESSION_STATUS.OFFLINE;
            closeConnection();
            config.onClose();
        };

        // Disparado quando ocorre erro no WebSocket
        ws.onerror = function (e) {
            serverStatus = SESSION_STATUS.OFFLINE;
            config.onError(ERROR_CODES.NETWORK, e.code + "/" + e.reason + "/" + e.wasClean + "/" + e.data);
            closeConnection();
        }

        return ws;
    }

    //Cancela os objeto WebSocket abertos
    closeConnection = function () {
        config.onWarning("método close connection");
        //Para a captura e envio de audio
        if (ws && serverStatus != SESSION_STATUS.OFFLINE) {
            if (ws.readyState == 1)
                ws.close();
            ws = null;
        }
        else {
            config.onWarning("O Servidor já estava desconectado. O comando foi ignorado");
            return;

        }
        serverStatus = SESSION_STATUS.OFFLINE;
    }

    //#################### Termino WebSocket ##############################

};

