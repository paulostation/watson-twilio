/** 
 * This file configure the logger for the application 
 * @author Paulo Henrique <pauloh@br.ibm.com>  
 */

var winston = require("winston");

winston.level = "verbose";
winston.info("Winston is using " + winston.level + " logger level");

module.exports = {
	log: winston.log,
	info: winston.info,
	debug: winston.debug,
	error: winston.error,
	verbose: winston.verbose,
	trace: winston.silly,
	silly: winston.silly
};