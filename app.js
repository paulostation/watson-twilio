var express = require('express');
var BinaryServer = require('binaryjs').BinaryServer;
var fs = require('fs');
const request = require('request');


var port = 3700;
var app = express();

app.set('views', __dirname + '/tpl');
app.set('view engine', 'jade');
app.engine('jade', require('jade').__express);
app.use(express.static(__dirname + '/public'))

app.get('/', function (req, res) {
  res.render('index');
});

app.listen(port);

console.log('server open on port ' + port);

binaryServer = BinaryServer({ port: 9001 });

binaryServer.on('connection', function (client) {
  console.log('new connection');

  client.on('stream', function (stream, meta) {
    console.log('new stream');
    
    stream.pipe(request({
      url: 'http://node-red.isc.br.ibm.com:8025/asr-server/rest/recognize/8k\?lm\=builtin:slm/general',
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Transfer-Encoding': 'chunked' }
    }, (err, resp, body) => {
      console.log(3, body);
    }));

    stream.on('end', function () {
      console.log('done stream');
    });
  });
});
