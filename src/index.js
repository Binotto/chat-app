const express = require('express')
const http = require('http')
const path = require('path')
const socketio = require('socket.io')

const app = express()
const server = http.createServer(app)  
const port = process.env.PORT || 3000
const io = socketio(server)

// Define paths for Express config
const publicDirectoryPath = path.join(__dirname, '../public')

// Setup static directory to serve
app.use(express.static(publicDirectoryPath))

io.on('connection', () => {
    console.log('New WebSockets connection')
})

server.listen(port, () => {
    console.log('Server is up on port ' + port)
})