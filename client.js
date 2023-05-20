const net = require('net')
const port = 3000

process.on('SIGINT', () => {
    console.log(`Received termination signal...`)
    console.log(`Leaving the chat...`)
    console.log(`Bye.`)
    process.exit(0)
})

const client = net.createConnection(port, () => {
    console.log(`Successfully connected to server localhost:${port}.  Ctrl+C to disconnect.`)
})

client.on('error', (err) => {
    console.log(`Client error: ${err.code}`)
})

client.on('data', (data) => {
    console.log(`${data.toString().trim()}`)
//    process.stdout.write(`${data.toString()}`)
})

client.on('close', () => {
    console.log('The connection to the server has been terminated.')
})

process.stdin.pipe(client)
