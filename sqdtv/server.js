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

// Store active streams and users
const activeStreams = {};
const activeUsers = {};

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Send existing streams to new client
    socket.emit('existingStreams', activeStreams);

    // Handle stream start/update
    socket.on('streamUpdate', (data) => {
        console.log('Stream update:', data);
        activeStreams[data.id] = {
            type: data.type,
            channel: data.channel,
            position: data.position
        };
        socket.broadcast.emit('streamUpdate', data);
    });

    // Handle user movement with interpolation
    socket.on('userMoved', (data) => {
        const user = activeUsers[data.username];
        if (user) {
            user.position = data.position;
            user.timestamp = Date.now();
            socket.broadcast.emit('userMoved', {
                username: data.username,
                position: data.position,
                timestamp: user.timestamp
            });
        }
    });

    // Handle user joining
    socket.on('userJoined', (data) => {
        console.log('User joined:', data);
        activeUsers[data.username] = {
            position: data.position,
            timestamp: Date.now()
        };
        socket.broadcast.emit('userJoined', data);
    });

    // Handle chat messages
    socket.on('chatMessage', (data) => {
        console.log('Chat message:', data);
        io.emit('chatMessage', data);
    });

    // Handle user leaving
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        // Clean up user data if needed
    });
});

// Start server
const PORT = 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 