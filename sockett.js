// // const http = require("http");
// // const io = require('socket.io')(http)
// // var user={};
// // io.on('connection', (socket) => {

// //     console.log('Connected...')

// //     socket.on('join', (userid) => {
// //         users[userid]=socket.id;
// //     });

// //     socket.on('privateMessage', (data) => {
// //         io.sockets.socket(users[data.to]).emit('message', data.msg);
// //     });

// //     socket.on('publicMessage', (msg) => {
// //         socket.broadcast.emit('message', msg)
// //     });
// // });

// const http = require('http');
// const express = require('express');
// const socketIO = require('socket.io');

// const app = express();
// const server = http.createServer(app);
// const io = socketIO(server);
// app.get('/socket.io/socket.io.js', (req, res) => {
//     res.sendFile(__dirname + '/node_modules/socket.io-client/dist/socket.io.js');
//   });
// io.on('connection', (socket) => {
//   // Handle new socket connections
//   socket.on('message', (message, recipientId) => {
//     // Broadcast the message to the recipient
//     io.to(recipientId).emit('message', message);
//   });
// });

// server.listen(8080, () => {
//   console.log('Socket.IO server is running on port 8080');
// });

const httpServer = require("http").createServer();
// const io = require("socket.io")(httpServer, {
//   cors: {
//     origin: "http://localhost:8080",
//   },
// });

const io = require("socket.io")(httpServer, {
  cors: { origin: "*", credentials: true },
});

const mysql = require("mysql2/promise"); // Use 'mysql2' for MySQL database

const db = mysql.createPool({
  host: "tradibletestdb.cxzqgdbryjpq.us-east-1.rds.amazonaws.com",
  port: 3306,
  database: "tradibletestnetdb",
  user: "tradibleuser",
  password: "GsYb6OApRadSjC3L0mfY",
});

async function insertChatMessage(senderId, receiverId, text) {
  try {
    const [rows] = await db.execute(
      "INSERT INTO chatMessages (sender_id, recipient_id, message_text) VALUES (?, ?, ?)",
      [senderId, receiverId, text]
    );
    const [rowss] = await db.execute(
      "SELECT * FROM chatUsers where sender_id=?",
      [senderId]
    );
    console.log(rowss, "--------rowss");
    if (rowss && rowss.length === 0) {
      await db.execute(
        "INSERT INTO chatUsers (sender_id, recipient_id, lastMessage) VALUES (?, ?, ?)",
        [senderId, receiverId, text]
      );
    }

    console.log("Chat message inserted into the database");
  } catch (error) {
    console.error("Error inserting chat message into the database:", error);
  }
}

async function getChatMessage() {
  try {
    const [rows] = await db.execute("SELECT * FROM chatUsers");
    return rows;
    console.log("Chat message inserted into the database");
  } catch (error) {
    console.error("Error inserting chat message into the database:", error);
  }
}

async function getChatList() {
  try {
    const [rows] = await db.execute("SELECT * FROM userSockets");
    return rows;
    console.log("Chat message inserted into the database");
  } catch (error) {
    console.error("Error inserting chat message into the database:", error);
  }
}
io.use((socket, next) => {
  const username = socket.handshake.auth.username;
  if (!username) {
    return next(new Error("invalid username"));
  }
  socket.username = username;
  next();
});

// save users
async function insertChatuserSockets(payload) {
  try {
    const [rows] = await db.execute(
      "INSERT INTO userSockets (userId, socketId, userName) VALUES (?, ?, ?)",
      [payload.userId, payload.socketId, payload.userName]
    );
    console.log("Chat message inserted into the database");
  } catch (error) {
    console.error("Error inserting chat message into the database:", error);
  }
}

io.on("connection", async (socket) => {
  // fetch existing users
  const users = [];
  const getList = await getChatList();
  let payload;
  for (let [id, socket] of io.of("/").sockets) {
    payload = {
      userId: 1,
      socketId: id,
      userName: socket.username,
    };
    // users.push({
    //   userID: id,
    //   username: socket.username,
    // });
  }
  const isExist = getList.filter((dt) => dt.userName == payload.userName);
  console.log(isExist,'--------isExist');
  await insertChatuserSockets(payload);
  console.log(users, "------------users");
  socket.emit("users", users);

  console.log(getList, "------------------------getList");
  if (getList && getList.length > 0) {
    console.log("-----------------");
    getList.forEach((element) => {
      users.push({
        userID: element.socketId,
        username: element.userName,
      });
    });
    // users.push(getList);
  } else {
  }

  // notify existing users
  socket.broadcast.emit("user connected", {
    userID: socket.id,
    username: socket.username,
  });

  // forward the private message to the right recipient
  socket.on("private message", ({ content, to }) => {
    console.log(content, to, "------------");
    insertChatMessage(socket.id, to, content);
    socket.to(to).emit("private message", {
      content,
      from: socket.id,
    });
  });

  // notify users upon disconnection
  socket.on("disconnect", () => {
    socket.broadcast.emit("user disconnected", socket.id);
  });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () =>
  console.log(`server listening at http://localhost:${PORT}`)
);
