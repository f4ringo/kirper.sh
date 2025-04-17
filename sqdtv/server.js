const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling']
});
const path = require('path');

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Handle /sqdtv/ route explicitly
app.get('/sqdtv/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('New user connected, socket id:', socket.id);

    // Handle stream updates
    socket.on('streamUpdate', (data) => {
        console.log('Stream update received from', socket.id, ':', data);
        io.emit('streamUpdate', data);
    });

    // Handle chat messages
    socket.on('chatMessage', (data) => {
        console.log('Chat message received from', socket.id, ':', data);
        io.emit('chatMessage', data);
    });

    // Handle user joining
    socket.on('userJoined', (data) => {
        console.log('User joined event received from', socket.id, ':', data);
        io.emit('userJoined', data);
    });

    // Handle user leaving
    socket.on('disconnect', () => {
        console.log('User disconnected, socket id:', socket.id);
    });
});

// Start server
const PORT = 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 