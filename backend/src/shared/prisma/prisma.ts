import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { logger } from "../logger";

// const connectionString = process.env.DATABASE_URL;

// if (!connectionString) {
//     throw new Error("DATABASE_URL is not defined");
// }


const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
});


export const prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

export const connectDB = async () => {
    await prisma.$connect();
    logger.info({ db: "postgres" }, "Database connected");
};

export const disconnectDB = async () => {
    await prisma.$disconnect();
    logger.info({ db: "postgres" }, "Database disconnected");
};
