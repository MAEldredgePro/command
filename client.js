const net = require('net')
const port = 3000

process.on('SIGINT', () => {
    console.log(`Received termination signal...`)
    console.log(`Leaving the chat...`)
    console.log(`Bye.`)
    process.exit(0)
})

const client = net.createConnection(port, () => {
    console.log(`Successfully connected to server localhost:${port}`)
})

client.on('error', (err) => {
    console.log(`Client error: ${err.code}`)
})

client.on('data', (data) => {
    process.stdout.write(`${data.toString()}`)
})

process.stdin.pipe(client)
