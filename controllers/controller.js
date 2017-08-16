let io = require("../bin/webServer").io;
const winston = require("../bin/logger.js");

io.on("connection", socket => {

	winston.debug("New client connected");
	// Use socket to communicate with this particular client only, sending it it's own id

	socket.emit("welcome", { message: "Welcome!", id: socket.id });

	let buffer = [];

	socket.on("audio", audio => {
		
		buffer.push(audio);
		
	});

	socket.on("finished", () => {
		console.log(buffer.length);
		let audioBuffer = Buffer.concat(buffer);
		console.log(audioBuffer);
	});
});