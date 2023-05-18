// Create the chat.log file to keep track of server events and
// client interactions.
const logger = require('./log')
logger.create('./server.log')

// Alias the logger.write function to a shorter identifier that
// is intuitive and easy to type.
const log = logger.write

// Use this counter to build unique User IDs
let numActiveConnections = 0
const port = process.env.port || 3000

// The 'log' function writes a sender's message to the chat.log file and
// optionally to the console as well.  Default behavior is to write to both.
log('Server', 'Starting Chat Server...')

// Global array that will keep track of all the currently connected chat clients.
var connectedClients = []

// Mount a function to handle Ctrl+C events at the server terminal so that
// the server can gracefully shut down.
process.on('SIGINT', () => {
    log('Server', 'Received SIGINT.  Shutting down chat server')
    log('Server', 'Goodbye.\n', true)
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

    // Log a status message indicating that a new client has connected.
    const joinMessage = log('Server', `${clientID} has joined the chat`)

    // Notify all currently connected clients that the new client
    // has joined the chat
    connectedClients.forEach(clientSock => clientSock.write(joinMessage + '\n'))

    // Mount the event handlers for this client socket connection
    mountClientSockEventHandlers(clientSock)

    // Add the current connection to the list of connected clients
    connectedClients.push(clientSock)

    // Log the number of currently attached clients
    const client_s_String = `client${connectedClients.length === 1 ? '' : 's'}`
    log('Server', `${connectedClients.length} ${client_s_String} attached`)

    // Send a welcome message to the client
    clientSock.write(`[Server] Welcome to the chat, ${clientSock.clientID}\n`)
})

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
    log('Server', `Chat server is up and listening for clients on port ${port}`)
})

// handle commands and messages coming from a client
function handleClientData(data) {
    const message = data.toString().trim()

    // Log the client's chat message to the server log file and server console.
    log(this.clientID, message)

    if (message.startsWith('/') && handleCommand(this, message)) { return; }

    // Broadcast the client's chat message to all the other clients,
    // being sure to exclude the sending client from the list of targets.

    // Select the targets.
    const targets =
        connectedClients.filter(c => c.clientID !== this.clientID)

    // Format the chat message.
    const chatMessage = logger.addSender(this.clientID, message)

    // Distribute the chat message.
    targets.forEach(target => target.write(`${chatMessage}`))
}

// Handle the event generated when the client disconnects from the server.
function handleClientClose() {
    // remove client from our list of connected clients
    connectedClients =
        connectedClients.filter(c => c.clientID !== this.clientID)

    // Log to the server console that this client has disconnected.
    const leaveMessage = `${this.clientID} has left the chat`
    log('Server', leaveMessage)

    // Notify all other clients that this client has left the chat
    connectedClients.forEach(c => c.write(`[Server] ${leaveMessage}\n`))
    const client_s_String = `client${connectedClients.length === 1 ? '' : 's'}`

    // Log the number of remaining connected clients.
    log('Server', `${connectedClients.length} ${client_s_String} attached`)
    if (connectedClients.length === 0) { numActiveConnections = 0 }
}

function handleCommand(clientSock, message) {

    const [command, ...arguments] = message.replace(/^\//, '').split(' ')
    console.log(`command: ${command}`)
    console.log(`argumentsString: ${arguments}`)
    switch (command.toLowerCase()) {
        case 'clientlist':
            handleClientList(clientSock)
            break;
        default: return false;
    }
    return true;
}

function handleClientList(clientSock) {
    clientSock.write(`[Server] Currently connected clients:\n`)
    connectedClients.forEach((connectedClient) => {
        clientSock.write(`[Server] ${connectedClient.clientID}\n`)
    })
}
