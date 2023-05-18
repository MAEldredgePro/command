const fs = require('fs');
var logfilename;

function create(filename) {
    logfilename = filename;

    const initialMessage = createLogMessage('Logger', 'Starting new log')
    fs.writeFileSync(logfilename, initialMessage + '\n', { flag: 'w' })
}

function createLogMessage(from, message) {
    const now = new Date();
    const timestamp = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
    return `${timestamp} [${from}] ${message}`.trim();
}

function write(from, message, logToConsole = true) {
    const messageString = createLogMessage(from, message);

    // Write the message string to the log file.
    fs.writeFileSync(logfilename, messageString + '\n', { flag: 'a' })

    // Write to the console as well if requested.
    if (logToConsole) console.log(messageString);

    return messageString
}

module.exports = { create, write }
