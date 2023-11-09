// const express = require('express');
// const http = require('http');
// const socketIo = require('socket.io');

// const app = express();
// const server = http.createServer(app);

// const io = socketIo(server);

// io.on('connection', (socket) => {
//   console.log('A user connected');

//   socket.on('sendMessage', (message) => {
//     const timestamp = new Date().toISOString();

//     // Broadcast the message to all connected users
//     io.emit('message', {
//       username: socket.client.username,
//       message,
//       timestamp,
//     });
//   });

//   socket.on('disconnect', () => {
//     console.log('A user disconnected');
//   });
// });

// server.listen(3000, () => {
//   console.log('Server listening on port 3000');
// });

const webSocket = require('ws')
const server = new webSocket.Server({port:'8080'})

server.on('connection', socket => {
    console.log('Client connected')
    socket.on('message', message => {
        server.clients.forEach(client=>{
            if(client.readyState === webSocket.OPEN)
                client.send(`${message}`)
        })
    })
})

console.log('socket initialized on port 8080')