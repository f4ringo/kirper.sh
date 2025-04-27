import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface Avatar {
    id: string;
    username: string;
    x: number;
    y: number;
    color: string;
}

export const useCanvasStore = defineStore('canvas', () => {
    // State
    const avatars = ref<Record<string, Avatar>>({});
    const currentUser = ref<Avatar | null>(null);
    const ws = ref<WebSocket | null>(null);
    const isConnected = ref(false);
    const username = ref('');

    // Computed
    const avatarList = computed(() => Object.values(avatars.value));

    // Actions
    function connect(inputUsername: string) {
        username.value = inputUsername;
        console.log('Connecting to WebSocket...', inputUsername);

        // Create WebSocket connection
        const wsUrl = 'ws://localhost:3000/api/ws';  // Force the correct URL
        console.log('WebSocket URL:', wsUrl);

        try {
            ws.value = new WebSocket(wsUrl);

            // Set up event handlers
            ws.value.onopen = () => {
                console.log('WebSocket connected');
                isConnected.value = true;
                // Join the canvas
                ws.value?.send(JSON.stringify({
                    type: 'join',
                    username: inputUsername
                }));
            };

            ws.value.onerror = (error) => {
                console.error('WebSocket error:', error);
                isConnected.value = false;
            };

            ws.value.onmessage = (event) => {
                console.log('WebSocket message received:', event.data);
                const data = JSON.parse(event.data);

                switch (data.type) {
                    case 'canvas_state':
                        // Initialize canvas with current state
                        avatars.value = data.avatars.reduce((acc: Record<string, Avatar>, avatar: Avatar) => {
                            acc[avatar.id] = avatar;
                            return acc;
                        }, {});
                        break;

                    case 'avatar_added':
                        // Add new avatar
                        avatars.value[data.avatar.id] = data.avatar;
                        if (data.avatar.username === username.value) {
                            currentUser.value = data.avatar;
                        }
                        break;

                    case 'avatar_moved':
                        // Update avatar position
                        if (avatars.value[data.avatar.id]) {
                            avatars.value[data.avatar.id] = data.avatar;
                        }
                        break;

                    case 'avatar_removed':
                        // Remove avatar
                        delete avatars.value[data.id];
                        break;
                }
            };

            ws.value.onclose = () => {
                console.log('WebSocket closed');
                isConnected.value = false;
                // Attempt to reconnect after a delay
                setTimeout(() => {
                    if (username.value) {
                        console.log('Attempting to reconnect...');
                        connect(username.value);
                    }
                }, 3000);
            };
        } catch (error) {
            console.error('Error creating WebSocket:', error);
            isConnected.value = false;
        }
    }

    function moveAvatar(x: number, y: number) {
        if (!ws.value || !currentUser.value) {
            console.log('Cannot move avatar:', { ws: !!ws.value, currentUser: !!currentUser.value });
            return;
        }

        ws.value.send(JSON.stringify({
            type: 'move',
            x,
            y
        }));
    }

    function disconnect() {
        console.log('Disconnecting...');
        if (ws.value) {
            ws.value.close();
            ws.value = null;
        }
        isConnected.value = false;
        avatars.value = {};
        currentUser.value = null;
        username.value = '';
    }

    return {
        avatars,
        currentUser,
        isConnected,
        username,
        avatarList,
        connect,
        moveAvatar,
        disconnect
    };
}); 