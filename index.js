// const WebSocket = require('ws');
// const wss = new WebSocket.Server({ port: 3000 }); // Choose a suitable port

// // Store connected clients (senders and receivers)
// const clients = new Set();

// wss.on('connection', (ws) => {
//   // Handle incoming WebSocket connections
//   clients.add(ws);

//   ws.on('message', (message) => {
//     console.log(message.toString(),'--------------------message 12');
//     // Broadcast the received message to all connected clients
//     clients.forEach((client) => {
//       if (client !== ws && client.readyState === WebSocket.OPEN) {
//         client.send(message.toString());
//       }
//     });
//   });

//   ws.on('close', () => {
//     // Remove the disconnected client from the set
//     clients.delete(ws);
//   });
// });

const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const mysql = require("mysql2/promise"); // Use 'mysql2' for MySQL database

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const clients = new Map();
// Database connection setup
const db = mysql.createPool({
  host: "tradibletestdb.cxzqgdbryjpq.us-east-1.rds.amazonaws.com",
  port: 3306,
  database: "tradibletestnetdb",
  user: "tradibleuser",
  password: "GsYb6OApRadSjC3L0mfY",
});

// WebSocket connection handling
wss.on("connection", (ws) => {
  ws.on("message", async (message) => {
    const msgData = JSON.parse(message);
    // console.log(msgData, "---------------msgData");
    if (msgData.action === "getChatList") {
      // Handle request for chat list
      const chatList = await getChatListFromDatabase(); // Implement this function
      ws.send(JSON.stringify({ action: "chatList", chatList }));
    } else {
      // Handle other messages and save them to the database
      const { senderId, receiverId, text } = msgData;
      //     console.log();
      // Save the message to the database
      const [rows] = await db.execute(
        "INSERT INTO conversations (senderId, receiverId, lastMessage) VALUES (?, ?, ?)",
        [senderId, receiverId, text]
      );
      // Find the WebSocket connection by socket ID
      //   console.log(wss.clients,'------------wss.clients');
      const targetSocket = clients.get(receiverId);
      console.log("--------targetSocket", targetSocket);
      if (targetSocket) {
        // Send the message to the target WebSocket connection
        // targetSocket.send(JSON.stringify({ sender: "Server", text }));
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(msgData));
          }
        });
      }
    }
  });
});

async function getChatListFromDatabase() {
  // Implement your database query to fetch the chat list
  const [rows] = await db.execute(
    "SELECT id, senderId,lastMessage FROM conversations"
  );
  console.log(rows, "--------------");
  return rows;
}

server.listen(8080, () => {
  console.log("Server is running on port 8080");
});
