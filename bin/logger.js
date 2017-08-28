/** 
 * This file configure the logger for the application 
 * @author Paulo Henrique <pauloh@br.ibm.com>  
 */

var winston = require("winston");

winston.level = "trace";

module.exports = {
	log: winston.log,
	info: winston.info,
	debug: winston.debug,
	error: winston.error,
	verbose: winston.verbose,
	trace: winston.trace	
};