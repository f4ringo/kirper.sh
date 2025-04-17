// SQD App - Social Canvas

// Global variables
let username = '';
let socket;
let canvas;
let ctx;
let users = {};
let myAvatar = null;
let streams = {};
let animationFrameId = null;
let widgets = {};
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let selectedWidget = null;

// Animation settings
const MOVEMENT_DURATION = 500; // ms
const ANIMATION_FPS = 60;

// Widget Panel Toggle
const widgetPanelToggle = document.getElementById('widget-panel-toggle');
const widgetPanel = document.getElementById('widget-panel');
let isWidgetPanelVisible = true;

widgetPanelToggle.addEventListener('click', () => {
    isWidgetPanelVisible = !isWidgetPanelVisible;
    widgetPanel.classList.toggle('collapsed', !isWidgetPanelVisible);
    widgetPanelToggle.style.transform = isWidgetPanelVisible ?
        'rotate(0deg)' :
        'rotate(180deg)';
});

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Show username modal
    const modal = document.getElementById('username-modal');
    modal.style.display = 'flex';

    // Initialize canvas
    initCanvas();

    // Initialize socket connection
    initSocket();

    // Initialize chat toggle
    initChatToggle();

    // Create and initialize toolbar
    createToolbar();

    // Start animation loop
    startAnimationLoop();

    // Handle window resize
    window.addEventListener('resize', handleResize);
});

// Initialize the canvas
function initCanvas() {
    canvas = document.getElementById('main-canvas');
    ctx = canvas.getContext('2d');

    // Set canvas size to match container
    const canvasWrapper = document.getElementById('canvas-wrapper');
    canvas.width = canvasWrapper.clientWidth;
    canvas.height = canvasWrapper.clientHeight;

    // Add event listeners for canvas interaction
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('mousemove', handleCanvasMouseMove);
}

// Initialize socket connection
function initSocket() {
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
        console.log('Connected to server');
    });

    // Handle existing streams
    socket.on('existingStreams', (streamsData) => {
        Object.entries(streamsData).forEach(([id, stream]) => {
            if (!document.getElementById(id)) {
                addStreamWidget(id, stream.type, stream.position, stream.channel);
            }
        });
    });

    // Handle stream updates
    socket.on('streamUpdate', (data) => {
        const existingWidget = document.getElementById(data.id);
        if (!existingWidget) {
            addStreamWidget(data.id, data.type, data.position, data.channel);
        } else if (data.channel) {
            loadStream(data.id, data.type, data.channel);
        }
    });

    // Handle user movement with interpolation
    socket.on('userMoved', (data) => {
        if (data.username !== username) {
            const user = users[data.username];
            if (user) {
                user.startPosition = { ...user.position };
                user.targetPosition = data.position;
                user.moveStartTime = Date.now();
                user.moveDuration = MOVEMENT_DURATION;
            }
        }
    });

    // Handle chat messages
    socket.on('chatMessage', (data) => {
        addChatMessage(data.username, data.message);
    });

    // Widget events
    socket.on('widgetAdded', (data) => {
        console.log('Widget added:', data);
        if (!document.getElementById(data.id)) {
            addWidget(data.id, data.type, data.position, data.config);
        }
    });

    socket.on('widgetMoved', (data) => {
        console.log('Widget moved:', data);
        const widget = document.getElementById(data.id);
        if (widget) {
            widget.style.left = `${data.position.x}px`;
            widget.style.top = `${data.position.y}px`;
            widgets[data.id].position = data.position;
        }
    });

    socket.on('widgetResized', (data) => {
        console.log('Widget resized:', data);
        const widget = document.getElementById(data.id);
        if (widget) {
            widget.style.width = `${data.width}px`;
            widgets[data.id].width = data.width;
        }
    });

    socket.on('widgetRemoved', (data) => {
        console.log('Widget removed:', data);
        removeWidget(data.id);
    });

    socket.on('widgetStreamUpdated', (data) => {
        console.log('Widget stream updated:', data);
        const widget = widgets[data.id];
        if (widget) {
            loadStream(data.id, data.type, data.channel);
        }
    });

    socket.on('existingWidgets', (widgetsData) => {
        console.log('Received existing widgets:', widgetsData);
        Object.entries(widgetsData).forEach(([id, widget]) => {
            if (!document.getElementById(id)) {
                addWidget(id, widget.type, widget.position, widget.config);
            }
        });
    });
}

// Initialize chat toggle
function initChatToggle() {
    const chatToggle = document.getElementById('chat-toggle');
    const chatSection = document.getElementById('chat-section');
    const chevron = chatToggle.querySelector('.chevron');

    chatToggle.addEventListener('click', () => {
        chatSection.classList.toggle('hidden');
        chevron.textContent = chatSection.classList.contains('hidden') ? '▶' : '◀';
    });
}

// Create toolbar
function createToolbar() {
    // Remove old widget panel if exists
    const oldPanel = document.querySelector('.widget-panel');
    if (oldPanel) oldPanel.remove();

    const oldToggle = document.querySelector('.widget-panel-toggle');
    if (oldToggle) oldToggle.remove();

    // Create new toolbar
    const toolbar = document.createElement('div');
    toolbar.id = 'widget-toolbar';

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'toolbar-buttons';

    const buttons = [
        { type: 'kick', text: 'Kick Stream' },
        { type: 'twitch', text: 'Twitch Stream' },
        { type: 'youtube', text: 'YouTube Video' },
        { type: 'tictactoe', text: 'Tic Tac Toe' }
    ];

    buttons.forEach(({ type, text }) => {
        const button = document.createElement('button');
        button.className = 'toolbar-button';
        button.setAttribute('data-widget', type);
        button.textContent = text;

        button.addEventListener('click', () => {
            // Check if widget already exists
            const existingWidget = document.querySelector(`.widget[data-type="${type}"]`);
            if (existingWidget) {
                console.log(`Widget of type ${type} already exists`);
                existingWidget.style.zIndex = '1000';
                return;
            }

            // Create new widget
            const widgetId = `widget-${type}-${Date.now()}`;
            const position = {
                x: Math.max(0, (window.innerWidth - 480) / 2),
                y: Math.max(0, (window.innerHeight - 270) / 2)
            };

            addWidgetFromButton(type, widgetId, position);
        });

        buttonContainer.appendChild(button);
    });

    toolbar.appendChild(buttonContainer);
    document.body.appendChild(toolbar);
}

// Handle window resize
function handleResize() {
    const canvasWrapper = document.getElementById('canvas-wrapper');
    canvas.width = canvasWrapper.clientWidth;
    canvas.height = canvasWrapper.clientHeight;
    renderCanvas();
}

// Set username and join the canvas
function setUsername() {
    const usernameInput = document.getElementById('username-input');
    username = usernameInput.value.trim();

    if (username) {
        document.getElementById('username-modal').style.display = 'none';

        // Create my avatar
        myAvatar = {
            username: username,
            position: { x: canvas.width / 2, y: canvas.height / 2 }
        };

        // Add my avatar to users
        users[username] = myAvatar;

        // Emit user joined event
        socket.emit('userJoined', {
            username: username,
            position: myAvatar.position
        });

        // Render canvas
        renderCanvas();
    }
}

// Handle canvas click
function handleCanvasClick(event) {
    if (!username) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Update my avatar position
    myAvatar.position = { x, y };

    // Emit user moved event
    socket.emit('userMoved', {
        username: username,
        position: myAvatar.position
    });

    // Render canvas
    renderCanvas();
}

// Handle canvas mouse move (for dragging widgets)
function handleCanvasMouseMove(event) {
    if (!username || !selectedWidget) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (isDragging) {
        const widget = widgets[selectedWidget];
        widget.position = {
            x: x - dragStartX,
            y: y - dragStartY
        };

        // Emit widget updated event
        socket.emit('widgetUpdated', {
            id: selectedWidget,
            position: widget.position
        });

        // Update widget element position
        const widgetElement = document.getElementById(`widget-${selectedWidget}`);
        if (widgetElement) {
            widgetElement.style.left = `${widget.position.x}px`;
            widgetElement.style.top = `${widget.position.y}px`;
        }
    }
}

// Render the canvas
function renderCanvas() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    drawGrid();

    // Draw avatars
    Object.values(users).forEach(user => {
        drawAvatar(user);
    });
}

// Draw grid on canvas
function drawGrid() {
    const gridSize = 50;
    const gridColor = 'rgba(255, 255, 255, 0.1)';

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;

    // Draw vertical lines
    for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

// Draw avatar on canvas
function drawAvatar(user) {
    const { username, position } = user;
    const avatarSize = 40;
    const x = position.x - avatarSize / 2;
    const y = position.y - avatarSize / 2;

    // Draw avatar circle
    ctx.fillStyle = '#4a90e2';
    ctx.beginPath();
    ctx.arc(position.x, position.y, avatarSize / 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw username initial
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(username.charAt(0).toUpperCase(), position.x, position.y);

    // Draw username label
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    const labelWidth = ctx.measureText(username).width + 16;
    const labelHeight = 20;
    ctx.fillRect(position.x - labelWidth / 2, position.y + avatarSize / 2 + 5, labelWidth, labelHeight);

    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.fillText(username, position.x, position.y + avatarSize / 2 + 15);
}

// Add user to the canvas
function addUser(username, position) {
    users[username] = {
        username: username,
        position: position
    };
    renderCanvas();
}

// Remove user from the canvas
function removeUser(username) {
    delete users[username];
    renderCanvas();
}

// Update user position
function updateUserPosition(username, position) {
    if (users[username]) {
        users[username].position = position;
        renderCanvas();
    }
}

// Send chat message
function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();

    if (message && username) {
        console.log('Emitting chatMessage event:', { username, message });
        socket.emit('chatMessage', { username, message });
        messageInput.value = '';
    }
}

// Add chat message to the chat
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

// Add widget from button
function addWidgetFromButton(type, widgetId, position) {
    if (!username) return;

    // Double-check for existing widget before creating
    const existingWidget = document.querySelector(`.widget[data-type="${type}"]`);
    if (existingWidget) {
        console.log(`Widget of type ${type} already exists, focusing it`);
        existingWidget.style.zIndex = '1000';
        return;
    }

    let config = {};
    switch (type) {
        case 'kick':
        case 'twitch':
            config = { channel: '' };
            break;
        case 'youtube':
            config = { videoId: '' };
            break;
        case 'tictactoe':
            config = { gameState: Array(9).fill('') };
            break;
    }

    // Add widget locally first
    addWidget(widgetId, type, position, config);

    // Only emit if widget was successfully added
    const widgetElement = document.getElementById(widgetId);
    if (widgetElement) {
        socket.emit('widgetAdded', {
            id: widgetId,
            type: type,
            position: position,
            config: config
        });
    }
}

// Add widget to the canvas
function addWidget(id, type, position, config) {
    // Check again for existing widget of this type
    const existingWidget = document.querySelector(`.widget[data-type="${type}"]`);
    if (existingWidget) {
        console.log(`Preventing duplicate widget of type ${type}`);
        return;
    }

    if (!['kick', 'twitch'].includes(type)) {
        return; // Only handle stream widgets
    }

    widgets[id] = {
        id: id,
        type: type,
        position: position,
        config: config
    };

    // Create widget element
    const widgetsContainer = document.getElementById('widgets-container');
    const widgetElement = document.createElement('div');
    widgetElement.id = id;
    widgetElement.className = `widget stream-widget ${type}-widget`;
    widgetElement.setAttribute('data-type', type);
    widgetElement.style.left = `${position.x}px`;
    widgetElement.style.top = `${position.y}px`;

    // Create widget header with controls
    const header = document.createElement('div');
    header.className = 'widget-header';

    // Search button
    const searchButton = document.createElement('button');
    searchButton.className = 'control-button search';
    searchButton.innerHTML = '🔍';
    searchButton.onclick = () => toggleSearchOverlay(id);

    // Move button
    const moveButton = document.createElement('button');
    moveButton.className = 'control-button move';
    moveButton.innerHTML = '✥';

    // Close button
    const closeButton = document.createElement('button');
    closeButton.className = 'control-button close';
    closeButton.innerHTML = '×';
    closeButton.onclick = () => {
        removeWidget(id);
        socket.emit('widgetRemoved', { id: id });
    };

    header.appendChild(searchButton);
    header.appendChild(moveButton);
    header.appendChild(closeButton);

    // Create widget content
    const content = document.createElement('div');
    content.className = 'widget-content';

    // Add player container
    content.innerHTML = `
        <div class="player-container">
            <div class="placeholder">Enter a ${type} channel to start streaming</div>
        </div>
        <div class="channel-info">${config.channel || 'No channel selected'}</div>
        <div class="search-overlay">
            <input type="text" class="search-input" placeholder="Enter ${type} channel name">
            <button class="search-button">Load Stream</button>
        </div>
    `;

    // Add resize handle
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    content.appendChild(resizeHandle);

    // Append elements
    widgetElement.appendChild(header);
    widgetElement.appendChild(content);
    widgetsContainer.appendChild(widgetElement);

    // Make widget draggable only by move button
    makeDraggable(widgetElement, moveButton);

    // Make widget resizable
    makeResizable(widgetElement, resizeHandle);

    // Add search functionality
    const searchOverlay = content.querySelector('.search-overlay');
    const searchInput = searchOverlay.querySelector('.search-input');
    const searchSubmit = searchOverlay.querySelector('.search-button');

    searchSubmit.onclick = () => {
        const channel = searchInput.value.trim();
        if (channel) {
            loadStream(id, type, channel);
            toggleSearchOverlay(id);
        }
    };

    searchInput.onkeypress = (e) => {
        if (e.key === 'Enter') {
            searchSubmit.click();
        }
    };
}

// Toggle search overlay
function toggleSearchOverlay(widgetId) {
    const widget = document.getElementById(widgetId);
    const overlay = widget.querySelector('.search-overlay');
    const isActive = overlay.classList.toggle('active');

    if (isActive) {
        const input = overlay.querySelector('.search-input');
        input.focus();
    }
}

// Load stream (unified function for both Kick and Twitch)
function loadStream(widgetId, type, channel) {
    const widget = widgets[widgetId];
    if (!widget) return;

    widget.config.channel = channel;

    // Update player
    const playerContainer = document.querySelector(`#${widgetId} .player-container`);
    const channelInfo = document.querySelector(`#${widgetId} .channel-info`);

    const streamUrls = {
        kick: `https://player.kick.com/${channel}`,
        twitch: `https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}`
    };

    playerContainer.innerHTML = `
        <iframe
            src="${streamUrls[type]}"
            frameborder="0"
            allowfullscreen="true"
            allow="autoplay; fullscreen"
        ></iframe>
    `;

    channelInfo.textContent = channel;

    // Emit stream update
    socket.emit('widgetStreamUpdated', {
        id: widgetId,
        type: type,
        channel: channel,
        config: widget.config
    });
}

// Remove widget from the canvas
function removeWidget(id) {
    delete widgets[id];

    const widgetElement = document.getElementById(id);
    if (widgetElement) {
        widgetElement.remove();
        // Emit widget removed
        socket.emit('widgetRemoved', { id: id });
    }
}

// Update widget
function updateWidget(id, config) {
    if (widgets[id]) {
        widgets[id].config = config;

        // Update widget-specific content
        switch (widgets[id].type) {
            case 'kick':
                const kickInput = document.querySelector(`#${id} .input-field`);
                if (kickInput) kickInput.value = config.channel || '';
                break;
            case 'twitch':
                const twitchInput = document.querySelector(`#${id} .input-field`);
                if (twitchInput) twitchInput.value = config.channel || '';
                break;
            case 'youtube':
                const youtubeInput = document.querySelector(`#${id} .input-field`);
                if (youtubeInput) youtubeInput.value = config.videoId || '';
                break;
            case 'tictactoe':
                updateTicTacToeBoard(id);
                break;
        }
    }
}

// Load YouTube video
function loadYouTubeVideo(widgetId) {
    const widget = widgets[widgetId];
    if (!widget) return;

    const input = document.querySelector(`#${widgetId} .input-field`);
    const videoId = input.value.trim();

    if (videoId) {
        widget.config.videoId = videoId;

        // Update widget content
        const content = document.querySelector(`#${widgetId} .widget-content`);
        content.innerHTML = `
            <iframe
                src="https://www.youtube.com/embed/${videoId}"
                frameborder="0"
                allowfullscreen="true"
                allow="autoplay; fullscreen"
                style="width: 100%; height: 100%;"
            ></iframe>
        `;

        // Emit widget updated event
        socket.emit('widgetUpdated', {
            id: widgetId,
            config: widget.config
        });
    }
}

// Make Tic Tac Toe move
function makeTicTacToeMove(widgetId, index) {
    const widget = widgets[widgetId];
    if (!widget || widget.config.gameState[index] !== '') return;

    // Update game state
    widget.config.gameState[index] = 'X';

    // Emit widget updated event
    socket.emit('widgetUpdated', {
        id: widgetId,
        config: widget.config
    });

    // Update board
    updateTicTacToeBoard(widgetId);
}

// Update Tic Tac Toe board
function updateTicTacToeBoard(widgetId) {
    const widget = widgets[widgetId];
    if (!widget) return;

    const cells = document.querySelectorAll(`#tictactoe-${widgetId} .tictactoe-cell`);
    cells.forEach((cell, index) => {
        cell.textContent = widget.config.gameState[index] || '';
    });
}

// Make element draggable
function makeDraggable(element, handle) {
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    handle.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    function dragStart(e) {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;

        if (e.target === handle) {
            isDragging = true;
            element.style.zIndex = '1000';
        }
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;

            xOffset = currentX;
            yOffset = currentY;

            setTranslate(currentX, currentY, element);

            // Emit position update
            const widgetId = element.id;
            socket.emit('widgetMoved', {
                id: widgetId,
                position: { x: currentX, y: currentY }
            });
        }
    }

    function setTranslate(xPos, yPos, el) {
        el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }

    function dragEnd(e) {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
        element.style.zIndex = '100';
    }
}

// Make element resizable
function makeResizable(element, handle) {
    let isResizing = false;
    let originalWidth = 0;
    let originalX = 0;

    handle.addEventListener('mousedown', (e) => {
        isResizing = true;
        originalWidth = element.offsetWidth;
        originalX = e.clientX;

        element.style.transition = 'none';
        document.body.style.cursor = 'ew-resize';
        e.stopPropagation();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;

        const width = originalWidth + (e.clientX - originalX);
        const minWidth = 320;
        const maxWidth = 1280;
        const newWidth = Math.min(Math.max(width, minWidth), maxWidth);

        element.style.width = `${newWidth}px`;

        // Emit resize update
        socket.emit('widgetResized', {
            id: element.id,
            width: newWidth
        });

        e.preventDefault();
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            element.style.transition = '';
            document.body.style.cursor = '';
        }
    });

    handle.addEventListener('dragstart', (e) => {
        e.preventDefault();
    });
}

// Handle Enter key in inputs
document.getElementById('username-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') setUsername();
});

document.getElementById('message-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// Animation loop
function startAnimationLoop() {
    function animate() {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw grid
        drawGrid();

        // Update and draw avatars
        Object.values(users).forEach(user => {
            if (user.startPosition && user.targetPosition) {
                const currentTime = Date.now();
                const elapsed = currentTime - user.moveStartTime;
                const progress = Math.min(elapsed / user.moveDuration, 1);

                // Interpolate position
                user.position = {
                    x: user.startPosition.x + (user.targetPosition.x - user.startPosition.x) * progress,
                    y: user.startPosition.y + (user.targetPosition.y - user.startPosition.y) * progress
                };

                // If movement is complete, clean up animation properties
                if (progress === 1) {
                    user.startPosition = null;
                    user.targetPosition = null;
                }
            }
            drawAvatar(user);
        });

        animationFrameId = requestAnimationFrame(animate);
    }

    animate();
}

// Add stream widget
function addStreamWidget(id, type, position, channel) {
    streams[id] = { type, position, channel };

    const widgetsContainer = document.getElementById('widgets-container');
    const widget = document.createElement('div');
    widget.id = id;
    widget.className = `widget stream-widget ${type}-widget`;
    widget.setAttribute('data-type', type);
    widget.style.left = `${position.x}px`;
    widget.style.top = `${position.y}px`;

    // Create widget content
    widget.innerHTML = `
        <div class="widget-header">
            <button class="control-button search">🔍</button>
            <button class="control-button move">✥</button>
            <button class="control-button close">×</button>
        </div>
        <div class="widget-content">
            <div class="player-container">
                <div class="placeholder">Enter a ${type} channel to start streaming</div>
            </div>
            <div class="channel-info">${channel || 'No channel selected'}</div>
            <div class="search-overlay">
                <input type="text" class="search-input" placeholder="Enter ${type} channel name">
                <button class="search-button">Load Stream</button>
            </div>
            <div class="resize-handle"></div>
        </div>
    `;

    widgetsContainer.appendChild(widget);

    // Add event listeners
    setupWidgetControls(widget, id, type);

    // If channel is provided, load the stream
    if (channel) {
        loadStream(id, type, channel);
    }
}

// Setup widget controls
function setupWidgetControls(widget, id, type) {
    const searchBtn = widget.querySelector('.search');
    const moveBtn = widget.querySelector('.move');
    const closeBtn = widget.querySelector('.close');
    const searchOverlay = widget.querySelector('.search-overlay');
    const searchInput = widget.querySelector('.search-input');
    const searchSubmit = widget.querySelector('.search-button');
    const resizeHandle = widget.querySelector('.resize-handle');

    searchBtn.onclick = () => toggleSearchOverlay(id);
    closeBtn.onclick = () => removeWidget(id);

    makeDraggable(widget, moveBtn);
    makeResizable(widget, resizeHandle);

    searchSubmit.onclick = () => {
        const channel = searchInput.value.trim();
        if (channel) {
            loadStream(id, type, channel);
            toggleSearchOverlay(id);
        }
    };

    searchInput.onkeypress = (e) => {
        if (e.key === 'Enter') {
            searchSubmit.click();
        }
    };
} 