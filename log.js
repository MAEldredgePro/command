const fs = require('fs');
var logFileName;

function create(fileName) {
    logFileName = fileName;

    const message = prependTimestamp(prependSender('Logger', 'Starting new log'))
    logFileWrite(message, CREATE_NEW_LOG)
}

function formatLogMessage(sender, message) {
    return prependTimestamp(prependSender(sender, message)) + '\n'
}

function prependTimestamp(message) {
    const now = new Date();
    const timestamp = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
    return `${timestamp} ${message}`;
}

function prependSender(sender, message) {
    return `[${sender}] ${message}`;
}

const LOG_TO_CONSOLE = true
const LOG_TO_FILE_ONLY = false
function logFrom(from, message, logToConsole = LOG_TO_CONSOLE) {
    const senderMessage = prependSender(from, message);

    // Write the message string to the log file.
    logFileWrite(prependTimestamp(senderMessage))

    // Write to the console as well if requested.
    if (logToConsole) console.log(senderMessage);
}

const APPEND_TO_LOG = true
const CREATE_NEW_LOG = false

function logFileWrite(message, append = APPEND_TO_LOG) {
    const FW_FLAG_REWRITE = 'w'
    const FW_FLAG_APPEND = 'a'
    const fileWriteFlag = append ? FW_FLAG_APPEND : FW_FLAG_REWRITE
    fs.writeFileSync(logFileName, `${message}\n`, { flag: fileWriteFlag })
}

module.exports = { create, prependSender, logFrom }
