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

    const message = `${clientID} has joined the chat`
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
    const client_s_String = `client${connectedClients.length === 1 ? '' : 's'}`
    log(`${connectedClients.length} ${client_s_String} attached`)

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

server.listen(3000, () => {
    log(`Chat server is up and listening for clients on port ${port}`)
})

// handle commands and messages coming from a client
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

    // Format the chat message.
    const chatMessage = logger.prependSender(this.clientID, message)

    // Distribute the chat message.
    notifyOtherClients(this.clientID, chatMessage)
}

function notifyOtherClients(sendingClient, message) {
    // Select the targets- everyone except clientToSkip
    const targets =
        connectedClients.filter(c => c.clientID !== sendingClient)

    // Distribute the message to the selected targets
    targets.forEach(target => sendToClient(target, `${message}\n`), sendingClient)
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

function handleCommand(clientSock, message) {
    // Separate the command from the arguments
    const [command, ...args] = message.replace(/^\//, '').split(' ')

    // Route the command to the corresponding handler
    switch (command.toLowerCase()) {
        case 'clientlist':
        case 'userlist':
            return handleClientList(clientSock)
            break;

        case 'username':
            return handleUpdateUsername(clientSock, args)

        case 'w':
            return handleWhisper(clientSock.clientID, args)

        case 'kick':
            return handleKick(clientSock.clientID, args)

        default: return false;
    }
    return true
}

function handleClientList(clientSock) {
    clientSock.write(`[Server] Currently connected clients:\n`)
    connectedClients.forEach((connectedClient) => {
        sendToClient(clientSock, connectedClient.clientID)
    })

    return true
}

function handleUpdateUsername(clientSock, args) {
    const oldName = clientSock.clientID
    clientSock.clientID = args[0]
    const clientMessage = `Your username is now '${clientSock.clientID}'`
    sendToClient(clientSock, clientMessage)

    const otherClientsMessage = `${oldName} will now be known as '${clientSock.clientID}'`
    notifyOtherClients(clientSock.clientID, otherClientsMessage)
    return true;
}

function handleWhisper(senderID, args) {
    [ targetUserID, ...messageWords ] = args
    const target = connectedClients.find(client => client.clientID === targetUserID)
    message = messageWords.join(' ')
    if (target) {
        sendToClient(target, message, senderID)
        return true;
    }

    return false;
}

function handleKick(senderID, args) {
    return false;
}
