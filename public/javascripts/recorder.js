(function (window) {
	var client = new BinaryClient("ws://localhost:9001");

	let samples = [];
	let checkSilenceHandler;
	let isSpeakingHandler;
	let speaking = false;

	function isSpeaking() {

		let maxSample = 0;
		let processedStuff = 0;

		samples.forEach((sampleArray, index) => {
			sampleArray.forEach(sample => {
				sample = Math.abs(sample);
				if (sample > maxSample) maxSample = sample;
			});
			processedStuff++;
			if (processedStuff === samples.length) {
				// console.log("finished");
				console.log("Checking for speech...", maxSample);

				if (maxSample > 0.12) {

					console.log("speech detected");
					speaking = true;
					window.Stream = client.createStream();
					checkSilenceHandler = setInterval(checkSilence, 1000);
					clearInterval(isSpeakingHandler);

				}
			}
		});
	}

	function checkSilence() {

		let maxSample = 0;
		let processedStuff = 0;

		samples.forEach((sampleArray, index) => {
			sampleArray.forEach(sample => {
				sample = Math.abs(sample);
				if (sample > maxSample) maxSample = sample;
			});
			processedStuff++;
			if (processedStuff === samples.length) {
				console.log("Checking for silence...", maxSample);
				if (maxSample < 0.08) {
					console.log("silence detected");
					speaking = false;
					samples = [];
					clearInterval(checkSilenceHandler);
					window.Stream.end();
					isSpeakingHandler = setInterval(isSpeaking, 250);
				}
			}
		});
	}

	client.on("open", function () {


		if (!navigator.getUserMedia)
			navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
				navigator.mozGetUserMedia || navigator.msGetUserMedia;

		if (navigator.getUserMedia) {
			navigator.getUserMedia({ audio: true }, success, function (e) {
				alert("Error capturing audio.");
			});
		} else alert("getUserMedia not supported in this browser.");

		var recording = false;

		window.startRecording = function () {

			window.Stream = client.createStream();
			recording = true;
		};

		window.stopRecording = function () {

			recording = false;
			window.Stream.end();
		};

		window.startRecording();

		function success(e) {

			audioContext = window.AudioContext || window.webkitAudioContext;
			context = new audioContext();

			// the sample rate is in context.sampleRate
			audioInput = context.createMediaStreamSource(e);

			var bufferSize = 16384;
			recorder = context.createScriptProcessor(bufferSize, 1, 1);

			recorder.onaudioprocess = function (e) {
				
				if (!recording) return;

				samples.push(e.inputBuffer.getChannelData(0));
				if (speaking) {
					var leftChannel = e.inputBuffer.getChannelData(0);
					// window.Stream.write(convertoFloat32ToInt16(leftChannel));
					window.Stream.write(leftChannel);
				}

			};

			audioInput.connect(recorder);
			recorder.connect(context.destination);
		}

		function convertoFloat32ToInt16(buffer) {
			var l = buffer.length;
			var buf = new Int16Array(l);

			while (l--) {
				buf[l] = buffer[l] * 0xFFFF;    //convert to 16 bit
			}
			return buf.buffer;
		}

		isSpeakingHandler = setInterval(isSpeaking, 250);

	});

	var audio = document.getElementById("player");
	// console.log(audio);
	client.on("stream", function (stream, meta) {
		// Buffer for parts
		var parts = [];
		// Got new data
		stream.on("data", function (data) {
			// console.log(data);
			parts.push(data);
		});
		stream.on("end", function () {

			// Display new data in browser!
			audio.src = (window.URL || window.webkitURL).createObjectURL(new Blob(parts));

			audio.play();

		});
	});

})(this);