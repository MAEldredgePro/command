const fs = require('fs');
var logfilename;

function create(filename) {
    logfilename = filename;

    const message = addTimestamp(addSender('Logger', 'Starting new log'))
    fs.writeFileSync(logfilename, message + '\n', { flag: 'w' })
}

function addSender(sender, message) {
    return `[${sender}] ${message}`;
}

function addTimestamp(message) {
    const now = new Date();
    const timestamp = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
    return `${timestamp} ${message}`;
}

function write(from, message, logToConsole = true) {
    const messageString = addSender(from, message);

    // Write the message string to the log file.
    fs.writeFileSync(logfilename, addTimestamp(messageString) + '\n', { flag: 'a' })

    // Write to the console as well if requested.
    if (logToConsole) console.log(messageString);

    return messageString
}

module.exports = { create, write }
