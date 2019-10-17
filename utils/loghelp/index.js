var log4js = require("log4js");
exports.log4js_config = require("./log4js.json");
log4js.configure(this.log4js_config);
exports.logger = log4js.getLogger("app");


// 使用方法
// var loghelp = require("loghelp");
// loghelp.logger.info("INFO TEST");
// loghelp.logger.warn("WARN TEST");
// loghelp.logger.error("ERROR TEST");