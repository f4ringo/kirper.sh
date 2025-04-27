import { FastifyInstance } from 'fastify'
import { z } from 'zod'

const drawActionSchema = z.object({
    type: z.literal('draw'),
    x: z.number(),
    y: z.number(),
    color: z.string(),
    lineWidth: z.number(),
})

const clearActionSchema = z.object({
    type: z.literal('clear'),
})

const actionSchema = z.discriminatedUnion('type', [
    drawActionSchema,
    clearActionSchema,
])

export async function canvasRoutes(fastify: FastifyInstance) {
    fastify.post('/save', async (request) => {
        const { name, data } = z.object({
            name: z.string(),
            data: z.string(),
        }).parse(request.body)

        // TODO: Implement canvas saving
        return { message: 'Canvas saved successfully' }
    })

    fastify.get('/list', async (request) => {
        // TODO: Implement canvas listing
        return { canvases: [] }
    })

    fastify.post('/action', async (request) => {
        const action = actionSchema.parse(request.body)

        // Broadcast the action to all connected WebSocket clients
        fastify.websocketServer.clients.forEach((client) => {
            if (client.readyState === 1) {
                client.send(JSON.stringify(action))
            }
        })

        return { success: true }
    })
} 