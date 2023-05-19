// Create the chat.log file to keep track of server events and
// client interactions.
const logger = require('./log')
logger.create('./server.log')

// Create a wrapper log function that automatically prepends 'Server' as the
// 'from' parameter

function log(message) {
    logger.logFrom('Server', message)
}

// Use this counter to build unique User IDs
let numActiveConnections = 0
const port = process.env.port || 3000

// The 'log' function writes a sender's message to the chat.log file and
// optionally to the console as well.  Default behavior is to write to both.
log('Starting Chat Server...')

// Global array that will keep track of all the currently connected chat clients.
var connectedClients = []

// Mount a function to handle Ctrl+C events at the server terminal so that
// the server can gracefully shut down.
process.on('SIGINT', () => {
    log('Received SIGINT.  Shutting down chat server')
    log('Goodbye.\n', true)
    process.exit(0)
})

// The 'net' module provides us the TCP functionality
// that we need to create and use the chat server.
const net = require('net')

const server = net.createServer()

// Mount the connection handler that will get called each time a client connects
// to the server
server.on('connection', (clientSock) => {
    // Create a unique user ID for this client and add it to the client socket
    const clientID = clientSock.clientID = `User${++numActiveConnections}`

    let message = `${clientID} has joined the chat`
    // Log a status message indicating that a new client has connected.
    log(message)

    // Notify all currently connected clients that the new client
    // has joined the chat
    connectedClients.forEach(clientSock => sendToClient(clientSock, message))

    // Mount the event handlers for this client socket connection
    mountClientSockEventHandlers(clientSock)

    // Add the current connection to the list of connected clients
    connectedClients.push(clientSock)

    // Log the number of currently attached clients
    const suffixNoneOrS = connectedClients.length === 1 ? '' : 's'
    message = `${connectedClients.length} client${suffixNoneOrS} attached`
    log(message)

    // Send a welcome message to the client
    sendToClient(clientSock, `Welcome to the chat, ${clientSock.clientID}`)
})

function sendToClient(clientSock, message, sender = 'Server') {
    const formattedMessage = logger.prependSender(sender, message)
    clientSock.write(`${formattedMessage}\n`)
}

function mountClientSockEventHandlers(clientSock) {
    // Mount the client data handler.  the 'data' event is generated when
    // a client types a command or chat message and sends it
    // to the server.
    clientSock.on('data', handleClientData)

    // Don't let client socket errors crash the server.
    clientSock.on('error', (err) => { })

    // Mount the handler to call when a client disconnects.
    clientSock.on('close', handleClientClose)
}

// Activate the server.
server.listen(3000, () => {
    log(`Chat server is up and listening for clients on port ${port}`)
})

// Handle chat messsages and commands coming from a client.
function handleClientData(data) {
    const message = data.toString().trim()

    // Log the client's chat message to the server log file and server console.
    logger.logFrom(this.clientID, message)

    if (message.startsWith('/') && handleCommand(this, message)) return;

    // Broadcast the client's chat message to all the other clients,
    // being sure to exclude the sending client from the list of targets.

    // Select the targets.
    const targets =
        connectedClients.filter(c => c.clientID !== this.clientID)

    // Distribute the chat message.
    notifyOtherClients(this.clientID, message)
}

// Broadcast a message to all connected clients except the sending client.
function notifyOtherClients(sendingClientID, message) {
    // Select the targets- everyone except clientToSkip
    const targets =
        connectedClients.filter(c => c.clientID !== sendingClientID)

    // Distribute the message to the targeted clients
   targets.forEach(clientSock => sendToClient(clientSock, message, sendingClientID))
    // targets.forEach(clientSock => console.log(clientSock.clientID))
}

// Handle the event generated when the client disconnects from the server.
function handleClientClose() {
    // remove client from our list of connected clients
    connectedClients =
        connectedClients.filter(c => c.clientID !== this.clientID)

    // Log to the server console that this client has disconnected.
    const leaveMessage = `${this.clientID} has left the chat`
    log(leaveMessage)

    // Notify all other clients that this client has left the chat
    connectedClients.forEach(c => c.write(`[Server] ${leaveMessage}\n`))
    const client_s_String = `client${connectedClients.length === 1 ? '' : 's'}`

    // Log the number of remaining connected clients.
    log(`${connectedClients.length} ${client_s_String} attached`)
    if (connectedClients.length === 0) { numActiveConnections = 0 }
}

// Handle a /command sent from the client.
function handleCommand(clientSock, message) {
    const commandHandlers = {
        'help': handleCmdHelp,
        'clientList': handleCmdClientList,
        'userList': handleCmdClientList,
        'username': handleCmdUsername,
        'w': handleCmdWhisper,
        'kick': handleCmdKick,
    }
    // Separate the command from the arguments
    const [command, ...args] = message.replace(/^\//, '').split(' ')

    const handler = commandHandlers[command];
    return handler(clientSock, args);

    // Route the command to the corresponding handler
    // switch (command.toLowerCase()) {
    //     case 'help':
    //         return handleCmdHelp(clientSock)
    //         break;

    //     case 'clientlist':
    //     case 'userlist':
    //         return handleCmdClientList(clientSock)
    //         break;

    //     case 'username':
    //         return handleCmdUsername(clientSock, args)

    //     case 'w':
    //         return handleCmdWhisper(clientSock.clientID, args)

    //     case 'kick':
    //         return handleCmdKick(clientSock.clientID, args)

    //     default: return false;
    // }
    // return true
}
// Handle the /help command
function handleCmdHelp(clientSock, args) {
    return true;
}

// Handle the /clientlist (aka /userlist) command.
function handleCmdClientList(clientSock) {
    clientSock.write(`[Server] Currently connected clients:\n`)
    connectedClients.forEach((connectedClient) => {
        let message = ''
        // prefix an asterix if this is the requesting user's ID
        if (clientSock.clientID === connectedClient.clientID) {
            message = '*'
        }
        message += connectedClient.clientID
        sendToClient(clientSock, message)
    })

    return true
}

// Handle the /username command.
function handleCmdUsername(clientSock, args) {
    if (args.length === 0) {
        // User set /username command with no args.  Tell him what
        // his own username is.
        let message = `Your username is '${clientSock.clientID}'.`
        sendToClient(clientSock, message)
        message = `Send /username <newUsername> to change your user name.`
        sendToClient(clientSock, message)
    } else {
        const oldClientID = clientSock.clientID
        clientSock.clientID = args.join(' ')

        // Notify the sending client that their Username has been updated
        var message = `Your username is now '${clientSock.clientID}'`
        sendToClient(clientSock, message)

        // Notify other users of the client's new name
        message =
         `${oldClientID} will now be known as '${clientSock.clientID}'`
        notifyOtherClients(clientSock.clientID, message)
    }

    return true;
}

// Handle the /w (whisper) command.
function handleCmdWhisper(clientSock, args) {
    [ targetUserID, ...messageWords ] = args
    const targetSock = connectedClients.find(client => client.clientID === targetUserID)
    message = messageWords.join(' ')
    if (targetSock) {
        sendToClient(targetSock, message, clientSock.clientID + ' says privately:')
        return true;
    }

    return false;
}

// Handle the /kick command.
function handleCmdKick(senderID, args) {
    return false;
}
