import { z } from 'zod'

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().default('3000'),
    JWT_SECRET: z.string(),
    FRONTEND_URL: z.string().default('http://localhost:5173'),
})

const env = envSchema.parse(process.env)

export const config = {
    env: env.NODE_ENV,
    port: parseInt(env.PORT, 10),
    jwtSecret: env.JWT_SECRET,
    frontendUrl: env.FRONTEND_URL,
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
} as const 