let express = require("express");
let router = express.Router();

const path = require("path"),
	{ twilioHandler } = require("../controllers/controller.js");

// Serves audio on Twilio
router.get("/play/:hashname", (req, res) => {

	res.download(path.join(__dirname, "../audio/preprocessed/" + req.params.hashname));

});

// Create a route that will handle Twilio webhook requests, sent as an
// HTTP POST to /voice in our application
router.post("/:workspace_name", (request, response, next) => {

	twilioHandler(request)
		.then(result => {
			response.send(result);
		})
		.catch(next);
});

module.exports = router;