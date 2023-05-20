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
    sendToClient(clientSock, `  Send '/help' for a list of available commands.`)
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
    const commands = {
        'help': {
            handler: handleHelp,
            usages: ['/help'],
            desc: 'Print the list of available commands'
        },
        'clientlist': {
            handler: handleClientList,
            usages: ['/clientlist'],
            desc: 'Print the list of currently connected clients'
        },
        'userlist': {
            handler: handleClientList,
            usages: ['/userList'],
            desc: 'Print the list of currently connected clients'
        },
        'username': {
            handler: handleUsername,
            usages: ['/username',
                '/username newUserName'],
            desc: 'Return your current username, or change your username'
        },
        'w': {
            handler: handleWhisper,
            usages: ['/w username messsage'],
            desc: 'Whisper (send message only to the specified user).'
        },
        'kick': {
            handler: handleKick,
            usages: ['/kick username password'],
            desc: 'Kick another user out of the chat session.  Must supply admin password'
        },
    }

    // Separate the command from the arguments
    const [command, ...args] = message.replace(/^\//, '').split(' ')

    // select the command spec using the command string
    const comspec = commands[command.toLowerCase()] || commands['help']

    // call the command handler
    try {
        comspec.handler(clientSock, args);
    }
    catch (e) {
        log(e)
    }

    return true;

    // '/help' command handler.  Defined here bc it needs access
    // to the 'commands' object which is also locallly defined in this
    // function.

    // Handle the /help command
    function handleHelp(clientSock, args) {
        let message = 'Here is a list of available commands:'
        sendToClient(clientSock, message)

        // Iterate the available commands and send the command and its
        // description to the client.
        Object.keys(commands).forEach((key) => {
            // Send an empty line to separate the commands one from another
            // Just a bit of vertical whitespace...
            sendToClient(clientSock, '')

            // Send the command for display
            sendToClient(clientSock, '/' + key)

            // send the 'Usage' sectio header
            const comspec = commands[key]
            sendToClient(clientSock, ` ${comspec.desc}`)
            sendToClient(clientSock, ' Usage:')

            // Send each of the 'Usage' examples
            // console.log(comspec.usages)
            comspec.usages.forEach((usage) => {
                sendToClient(clientSock, `  ${usage}`)
            })
        })

        log(`Successfully handled /help request from ${clientSock.clientID}`)
    }
}


// hanldle '/clientList' command
function handleClientList(clientSock) {
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
}

// Handle the /username command.
function handleUsername(clientSock, args) {
    const oldClientID = clientSock.clientID
    const newClientID = args.join(' ')

    if (args.length === 0) {
        // User set /username command with no args.  Tell him what
        // his own username is.
        let message = `Your username is '${clientSock.clientID}'.`
        sendToClient(clientSock, message)
        message = `Send /username newUsername to change your user name.`
        sendToClient(clientSock, message)
        log(`Successfully handled /username request from ${clientSock.clientID}`)
        return;
    }

    if (args.length > 1) {
        const message = `Error: Multi-word usernames are not allowed.`
        sendToClient(clientSock, message)
        throw new Error(`Error handling '/username ${newClientID}' request` +
        ` from ${oldClientID}.  Multi-word usernames are not allowed.`)
    }

    // check and see if the user is trying to choose his current
    // username as a new name.  It's a requirement.
    if (newClientID === oldClientID) {
        const message = `Error: your username is already ${newClientID}`
        sendToClient(clientSock, message)
        return true;
    }

    // Check to see if anyone else is already using the requested username.
    if (connectedClients.find(client => newClientID === client.clientID)) {
        const message = `Error: User name '${newClientID}' is already being used`
        sendToClient(clientSock, message)
        return true;
    }

    // Change the username
    clientSock.clientID = newClientID

    // Notify the sending client that their Username has been updated
    var message = `Your username is now '${clientSock.clientID}'`
    sendToClient(clientSock, message)

    // Notify other users of the client's new name
    message =
        `${oldClientID} will now be known as '${clientSock.clientID}'`
    notifyOtherClients('Server', message)

    log(`Successfully changed [${oldClientID}] username to [${newClientID}]`)
    return true;
}

// Handle the /w (whisper) command.
function handleWhisper(clientSock, args) {
    [targetUserID, ...messageWords] = args
    const targetSock = connectedClients.find(client => client.clientID === targetUserID)
    message = messageWords.join(' ')
    if (targetSock) {
        sendToClient(targetSock, message, clientSock.clientID + ' says privately:')
        return true;
    }

    return false;
}

// Handle the /kick command.
function handleKick(senderID, args) {
    return false;
}
