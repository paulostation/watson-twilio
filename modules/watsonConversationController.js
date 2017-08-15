/** 
 * Implements the connection to Watson Conversation
 * @module watsonConversationController
 * @author Paulo Henrique <pauloh@br.ibm.com>  
 * @requires module:cpqdApiController
 */

const cpqdApiController = require("./cpqdApiController.js");
const ConversationV1 = require("watson-developer-cloud/conversation/v1");
const TextToSpeechV1 = require('watson-developer-cloud/text-to-speech/v1');
const fs = require('fs');
const path = require("path");
const assert = require("assert");

// Set up Conversation service wrapper.
const conversation = new ConversationV1({
    username: "8b4bae75-b2f7-4aea-95c6-1df6de847f1c", // replace with username from service key
    password: "eTCTE34Y6TG5", // replace with password from service key
    path: { workspace_id: "974658f1-1649-4a52-92d5-4253313cc800" }, // replace with workspace ID
    version_date: "2016-07-11"
});
//Set up text to speech service wrapper
var text_to_speech = new TextToSpeechV1({
    username: 'f1e10a38-39bb-426f-a402-d278502792e6',
    password: 'HJctMn0kjkwQ'
});


var watsonGreetingAudioPath;// = '/home/pauloh/Source Codes/audiostream/audio/watsonGreeting.wav';

// Start conversation with empty message.
conversation.message({}, (err, response) => {
    if (err) {
        console.error(err); // something went wrong
        return;
    }

    // Display the output from dialog, if any.
    if (response.output.text.length != 0) {

        textToSpeech(response.output.text[0])
            .then(audioPath => {
                module.exports.watsonGreetingAudioPath = audioPath;
            })
            .catch(error => {
                console.log("Error while messaging watson on startup");
                console.log(error);
            });
    }

});

function hashCode(text) {
    var hash = 0, i, chr;
    if (text.length === 0) return hash;
    for (i = 0; i < text.length; i++) {
        chr = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }

    return Math.abs(hash);
};

function message(text, context) {

    return new Promise((resolve, reject) => {
        // Start conversation with empty message.
        conversation.message({
            input: {
                text: text
            },
            context: context
        },
            (err, response) => {
                if (err) {
                    console.error(err); // something went wrong
                    reject(err);
                }

                // Display the output from dialog, if any.
                if (response.output.text.length != 0) {

                    resolve(response);

                }
            });
    });
}


function hash(text) {

    var hash = 5381;

    let i = 0;

    while (i < text.length) {
        hash = ((hash << 5) + hash) + i; /* hash * 33 + c */
        i++;
    }
    return hash;
}



function watsonTextToSpeech(text, fileName) {

    return new Promise((resolve, reject) => {
        
        if (!text)
            reject("Text is not defined");

        if (!fileName)
            reject("file name is not defined");

        var params = {
            text: text,
            voice: 'pt-BR_IsabelaVoice',
            accept: 'audio/wav'
        };

        // Pipe the synthesized text to a file.
        var stream = text_to_speech.synthesize(params)
            .on('error', function (error) {
                console.log('Error:', error);
                reject(error);
            }).pipe(fs.createWriteStream(fileName))
            .on('finish', () => {
                resolve(fileName);
            });
    });

}



function textToSpeech(text) {

    return new Promise((resolve, reject) => {

        let hash = hashCode(text);
        let filePath = path.join(__dirname, "../audio/preprocessed/" + hash + ".wav");

        fs.readFile(filePath, (err, data) => {

            if (err) {

                //file not found, so let's download it create a hash and store
                if (err.errno  == -2) {
                    console.log(text);
                    console.log("Creating hash...");
                    watsonTextToSpeech(text, filePath)
                        .then(audioFilePath => {
                            resolve(audioFilePath);
                        }).catch(error => {
                            reject(error);
                        });
                } else {

                    console.log(err);
                }
            } else {
                console.log("File already hashed");
                watsonTextToSpeech(text, filePath)
                    .then(audioFilePath => {
                        resolve(audioFilePath);
                    });
            }

        });

    });

}

// textToSpeech("Olá mundo");

module.exports = {
    // speechToText: speechToText,
    message: message,
    watsonGreetingAudioPath: watsonGreetingAudioPath,
    textToSpeech: textToSpeech
};