// server/server.js - updated with delivery ACKs and read receipts

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory stores (for demo)
const users = {}; // socketId -> { username, id }
const messages = []; // message objects: { id, message, sender, senderId, timestamp, deliveredBy:[], readBy:[], isPrivate, to }
const typingUsers = {};

// Helper to find message by id
const findMessageById = (id) => messages.find((m) => String(m.id) === String(id));

// Socket events
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('user_join', (username) => {
    users[socket.id] = { username, id: socket.id };
    io.emit('user_list', Object.values(users));
    io.emit('user_joined', { username, id: socket.id });
    console.log(`${username} joined the chat`);
  });

  // Global message
  socket.on('send_message', (messageData) => {
    const msg = {
      id: Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      message: messageData.message,
      sender: users[socket.id]?.username || 'Anonymous',
      senderId: socket.id,
      timestamp: new Date().toISOString(),
      deliveredBy: [], // socketIds who've acknowledged delivery
      readBy: [], // socketIds who've read it
      isPrivate: false,
      to: null,
    };
    messages.push(msg);
    if (messages.length > 1000) messages.shift();

    // broadcast
    io.emit('receive_message', msg);
  });

  // private message
  socket.on('private_message', ({ to, message }) => {
    const msg = {
      id: Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      message,
      sender: users[socket.id]?.username || 'Anonymous',
      senderId: socket.id,
      timestamp: new Date().toISOString(),
      deliveredBy: [],
      readBy: [],
      isPrivate: true,
      to, // recipient socket id
    };
    messages.push(msg);
    io.to(to).emit('private_message', msg);
    socket.emit('private_message', msg); // echo to sender
  });

  // delivered ack from a client: { messageId }
  socket.on('delivered', ({ messageId }) => {
    const msg = findMessageById(messageId);
    if (!msg) return;
    if (!msg.deliveredBy.includes(socket.id)) {
      msg.deliveredBy.push(socket.id);
    }
    // notify the original sender that msg was delivered to socket.id
    io.to(msg.senderId).emit('message_delivered', {
      messageId: msg.id,
      deliveredBy: socket.id,
      deliveredByUsername: users[socket.id]?.username || 'Unknown',
    });
  });

  // read ack from a client: { messageId }
  socket.on('read', ({ messageId }) => {
    const msg = findMessageById(messageId);
    if (!msg) return;
    if (!msg.readBy.includes(socket.id)) {
      msg.readBy.push(socket.id);
    }
    // notify the original sender that msg was read by socket.id
    io.to(msg.senderId).emit('message_read', {
      messageId: msg.id,
      readBy: socket.id,
      readByUsername: users[socket.id]?.username || 'Unknown',
    });
  });

  // typing indicator
  socket.on('typing', (isTyping) => {
    if (users[socket.id]) {
      const username = users[socket.id].username;
      if (isTyping) typingUsers[socket.id] = username;
      else delete typingUsers[socket.id];
      io.emit('typing_users', Object.values(typingUsers));
    }
  });

  // disconnect
  socket.on('disconnect', () => {
    if (users[socket.id]) {
      const { username } = users[socket.id];
      io.emit('user_left', { username, id: socket.id });
      console.log(`${username} left the chat`);
    }
    delete users[socket.id];
    delete typingUsers[socket.id];
    io.emit('user_list', Object.values(users));
    io.emit('typing_users', Object.values(typingUsers));
  });
});

// API endpoints to fetch messages / users (for pagination or initial load)
app.get('/api/messages', (req, res) => {
  // optional pagination: ?cursor=<timestamp>&limit=50 (returns older messages before cursor)
  const { cursor, limit = 50 } = req.query;
  let result = messages.slice();
  if (cursor) {
    // cursor is message.timestamp (ISO); return messages older than cursor
    result = result.filter((m) => new Date(m.timestamp) < new Date(cursor));
  }
  // return newest first up to limit
  result = result.slice(-limit);
  res.json({ posts: result, total: messages.length });
});

app.get('/api/users', (req, res) => {
  res.json(Object.values(users));
});

app.get('/', (req, res) => res.send('Socket.io Chat Server is running'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io };

