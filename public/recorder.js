(function(window) {
  var client = new BinaryClient('ws://localhost:9001');

  client.on('open', function() {

    if (!navigator.getUserMedia)
      navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia || navigator.msGetUserMedia;

    if (navigator.getUserMedia) {
      navigator.getUserMedia({audio:true}, success, function(e) {
        alert('Error capturing audio.');
      });
    } else alert('getUserMedia not supported in this browser.');

    var recording = false;

    window.startRecording = function() {
      window.Stream = client.createStream();
      recording = true;
    }

    window.stopRecording = function() {
      recording = false;
      window.Stream.end();
    }

    function success(e) {
      audioContext = window.AudioContext || window.webkitAudioContext;
      context = new audioContext();

      // the sample rate is in context.sampleRate
      audioInput = context.createMediaStreamSource(e);

      var bufferSize = 4096;
      recorder = context.createScriptProcessor(bufferSize, 1, 1);

      recorder.onaudioprocess = function(e){
        if(!recording) return;
        console.log ('recording');
        var left = e.inputBuffer.getChannelData(0);
        window.Stream.write(convertoFloat32ToInt16(left));
      }

      audioInput.connect(recorder)
      recorder.connect(context.destination); 
    }

    function convertoFloat32ToInt16(buffer) {
      var l = buffer.length;
      var buf = new Int16Array(l)

      while (l--) {
        buf[l] = buffer[l]*0xFFFF;    //convert to 16 bit
      }
      return buf.buffer
    }
  });

var audio = document.getElementById('player');
console.log(audio);
  client.on('stream', function(stream, meta){    
      // Buffer for parts
      var parts = [];
      // Got new data
      stream.on('data', function(data){
        // console.log(data);
        parts.push(data);
      });
      stream.on('end', function(){
        // Display new data in browser!
        console.log(parts);
        

        
        audio.src = (window.URL || window.webkitURL).createObjectURL(new Blob(parts));
        console.log(audio.src);
        audio.play();
      });
    });

})(this);


// var audio = document.getElementById('player');
// ss(socket).on('audio-stream', function(stream, data) {
    // parts = [];
    // stream.on('data', function(chunk){
        // parts.push(chunk);
    // });
    // stream.on('end', function () {
        // audio.src = (window.URL || window.webkitURL).createObjectURL(new Blob(parts));
        // audio.play();
    // });
// });