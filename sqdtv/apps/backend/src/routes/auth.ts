import { FastifyInstance } from 'fastify'
import { z } from 'zod'

const loginSchema = z.object({
    username: z.string().min(3),
    password: z.string().min(6),
})

const registerSchema = loginSchema.extend({
    email: z.string().email(),
})

export async function authRoutes(fastify: FastifyInstance) {
    fastify.post('/login', async (request, reply) => {
        const { username, password } = loginSchema.parse(request.body)

        // TODO: Implement proper user authentication
        if (username === 'demo' && password === 'password') {
            const token = await reply.jwtSign({ username })
            return { token }
        }

        reply.status(401).send({ error: 'Invalid credentials' })
    })

    fastify.post('/register', async (request, reply) => {
        const { username, password, email } = registerSchema.parse(request.body)

        // TODO: Implement user registration
        // For now, just return a success message
        return { message: 'User registered successfully' }
    })
} 