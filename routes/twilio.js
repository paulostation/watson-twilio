let express = require("express");
let router = express.Router();

const path = require("path"),
	// twilio = require("twilio"),
	{ twilioHandler } = require("../controllers/controller.js");

// Serves audio on Twilio
router.get("/play/:hashname", (req, res) => {

	res.download(path.join(__dirname, "../audio/preprocessed/" + req.params.hashname));
  
});

// Create a route that will handle Twilio webhook requests, sent as an
// HTTP POST to /voice in our application
router.post("/start", (request, response) => {

	twilioHandler(request)
		.then(result => {
			response.send(result);
		})
		.catch(error => {
			response.status(500).send(error);
		});
});

module.exports = router;
