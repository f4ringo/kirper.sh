import fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import websocket from '@fastify/websocket'
import { config } from './config'
import { authRoutes } from './routes/auth'
import { canvasRoutes } from './routes/canvas'
import { canvasService } from './services/canvasService'
import { AvatarUpdate } from './types/avatar'

const app = fastify({
    logger: true
})

// Register plugins
app.register(cors, {
    origin: config.frontendUrl,
    credentials: true
})

app.register(jwt, {
    secret: config.jwtSecret
})

app.register(websocket)

// Health check endpoint
app.get('/api/health', async () => {
    return { status: 'ok' }
})

// Register routes
app.register(authRoutes, { prefix: '/api/auth' })
app.register(canvasRoutes, { prefix: '/api/canvas' })

// WebSocket handler
app.register(async function (fastify) {
    // Handle incoming messages
    fastify.get('/ws', { websocket: true }, (connection, req) => {
        let userId: string | null = null;

        connection.socket.on('message', (message) => {
            try {
                const data = JSON.parse(message.toString());

                switch (data.type) {
                    case 'join':
                        // Add new user to canvas
                        const avatar = canvasService.addAvatar(data.username);
                        userId = avatar.id;

                        // Send current canvas state to the new user
                        connection.socket.send(JSON.stringify({
                            type: 'canvas_state',
                            avatars: canvasService.getAllAvatars()
                        }));

                        // Notify others about the new user
                        broadcastToOthers(connection.socket, {
                            type: 'avatar_added',
                            avatar
                        });
                        break;

                    case 'move':
                        if (!userId) return;

                        // Update avatar position
                        const update: AvatarUpdate = {
                            id: userId,
                            x: data.x,
                            y: data.y
                        };

                        const updatedAvatar = canvasService.updateAvatarPosition(update);
                        if (updatedAvatar) {
                            // Broadcast the movement to all other clients
                            broadcastToOthers(connection.socket, {
                                type: 'avatar_moved',
                                avatar: updatedAvatar
                            });
                        }
                        break;
                }
            } catch (error) {
                console.error('Error processing WebSocket message:', error);
            }
        });

        // Handle disconnection
        connection.socket.on('close', () => {
            if (userId) {
                // Remove user from canvas
                canvasService.removeAvatar(userId);

                // Notify others about the user leaving
                broadcastToOthers(connection.socket, {
                    type: 'avatar_removed',
                    id: userId
                });
            }
        });

        // Helper function to broadcast to all clients except the sender
        function broadcastToOthers(sender: WebSocket, message: any) {
            fastify.websocketServer.clients.forEach((client) => {
                if (client !== sender && client.readyState === 1) {
                    client.send(JSON.stringify(message));
                }
            });
        }
    })
}, { prefix: '/api' })

// Start the server
const start = async () => {
    try {
        await app.listen({ port: config.port, host: '0.0.0.0' })
        console.log(`Server is running on port ${config.port}`)
    } catch (err) {
        app.log.error(err)
        process.exit(1)
    }
}

start() 