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
});


export const prisma = new PrismaClient({
    adapter
});

export const connectDB = async () => {
    await prisma.$connect();
    logger.info({ db: "postgres" }, "Database connected");
};

export const disconnectDB = async () => {
    await prisma.$disconnect();
    logger.info({ db: "postgres" }, "Database disconnected");
};