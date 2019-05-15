const express = require('express')
const http = require('http')
const path = require('path')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } =require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

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
    socket.on('join', (options, callback) => {
        const { error, user } =  addUser({ id: socket.id, ...options })

        if(error) {
            return callback(error)
        }

        socket.join(user.room)
    
        socket.emit('message', generateMessage('Administrator', 'Welcome'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Administrator', `${user.username} has joined!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()

    })

    socket.on('sendMessage', (message, callback) => {
        const user =  getUser(socket.id)
        const filter = new Filter()

        if(filter.isProfane(message)){
            socket.emit('message', generateMessage('Administrator', 'Shut up, Profanity is not allowed!'))
            return callback('Shut up, Profanity is not allowed!')
        }

        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()
    })

    socket.on('sendLocation', (coords, callback) => {
        const user =  getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if(user){
            io.to(user.room).emit('message', generateMessage('Administrator', `${user.username} has left! `))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }

        
    })
})

server.listen(port, () => {
    console.log('Server is up on port ' + port)
})