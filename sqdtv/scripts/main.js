let username = '';
let currentChannel = '';
let socket;

// Show username modal on page load
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('username-modal');
    modal.style.display = 'flex';

    // Initialize socket connection
    socket = io({
        path: '/sqdtv/socket.io',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000
    });

    // Socket connection events
    socket.on('connect', () => {
        console.log('Connected to server with socket id:', socket.id);
    });

    socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
    });

    socket.on('disconnect', (reason) => {
        console.log('Disconnected from server:', reason);
    });

    socket.on('reconnect', (attemptNumber) => {
        console.log('Reconnected to server after', attemptNumber, 'attempts');
    });

    socket.on('reconnect_error', (error) => {
        console.error('Reconnection error:', error);
    });

    // Socket event listeners
    socket.on('streamUpdate', (data) => {
        console.log('Received stream update:', data);
        if (data.channel) {
            updateStreamPlayer(data.channel);
        } else {
            clearStreamPlayer();
        }
    });

    socket.on('chatMessage', (data) => {
        console.log('Received chat message:', data);
        addChatMessage(data.username, data.message);
    });

    socket.on('userJoined', (data) => {
        console.log('User joined:', data);
        addChatMessage('System', `${data.username} joined the chat`);
    });

    socket.on('userLeft', (data) => {
        console.log('User left:', data);
        addChatMessage('System', `${data.username} left the chat`);
    });
});

function setUsername() {
    const usernameInput = document.getElementById('username-input');
    username = usernameInput.value.trim();

    if (username) {
        document.getElementById('username-modal').style.display = 'none';
        console.log('Emitting userJoined event:', { username });
        socket.emit('userJoined', { username });
    }
}

function loadStream() {
    const channelInput = document.getElementById('channel-input');
    currentChannel = channelInput.value.trim().toLowerCase();

    if (currentChannel) {
        console.log('Emitting streamUpdate event:', { channel: currentChannel });
        socket.emit('streamUpdate', { channel: currentChannel });
        updateStreamPlayer(currentChannel);
    }
}

function removeStream() {
    console.log('Emitting streamUpdate event to remove stream');
    socket.emit('streamUpdate', { channel: null });
    clearStreamPlayer();
}

function updateStreamPlayer(channel) {
    const streamPlayer = document.getElementById('stream-player');
    streamPlayer.innerHTML = `
        <iframe
            src="https://player.kick.com/${channel}"
            frameborder="0"
            allowfullscreen="true"
            allow="autoplay; fullscreen"
            style="width: 100%; height: 100%;"
        ></iframe>
    `;
    addChatMessage('System', `Stream loaded: ${channel}`);
}

function clearStreamPlayer() {
    const streamPlayer = document.getElementById('stream-player');
    streamPlayer.innerHTML = '';
    addChatMessage('System', 'Stream removed');
}

function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();

    if (message && username) {
        console.log('Emitting chatMessage event:', { username, message });
        socket.emit('chatMessage', { username, message });
        messageInput.value = '';
    }
}

function addChatMessage(sender, message) {
    const chatMessages = document.getElementById('chat-messages');
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    messageElement.innerHTML = `
        <span class="username">${sender}:</span>
        <span class="message">${message}</span>
    `;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Handle Enter key in inputs
document.getElementById('username-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') setUsername();
});

document.getElementById('channel-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') loadStream();
});

document.getElementById('message-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
}); 