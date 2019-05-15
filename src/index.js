const express = require('express')
const http = require('http')
const path = require('path')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } =require('./utils/messages')
const { addUser, removeUser, getUsers, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)  
const port = process.env.PORT || 3000
const io = socketio(server)

// Define paths for Express config
const publicDirectoryPath = path.join(__dirname, '../public')

// Setup static directory to serve
app.use(express.static(publicDirectoryPath))

let count = 0

io.on('connection', (socket) => {
    console.log('New WebSockets connection')

   

    socket.on('join', (options, callback) => {
        const { error, user } =  addUser({ id: socket.id, ...options })

        if(error) {
            return callback(error)
        }

        socket.join(user.room)
    
        socket.emit('message', generateMessage('Welcome'))
        socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined!`))

        callback()

    })

    socket.on('sendMessage', (message, callback) => {
        const filter = new Filter()

        if(filter.isProfane(message)){
            socket.emit('message', generateMessage('Shut up mother fucker, Profanity is not allowed!'))
            return callback('Shut up mother fucker, Profanity is not allowed!')
        }

        io.to('PUC').emit('message', generateMessage(message))
        callback()
    })

    socket.on('sendLocation', (coords, callback) => {
        io.emit('locationMessage', generateLocationMessage(`https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if(user){
            io.to(user.room).emit('message', generateMessage(`${user.username} has left! `))
        }

        
    })
})

server.listen(port, () => {
    console.log('Server is up on port ' + port)
})