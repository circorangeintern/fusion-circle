import app from "./index";
import dotenv from "dotenv";
import { connectDB } from "./shared/prisma/prisma";
import { logger } from "./shared/logger";

dotenv.config();

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await connectDB();
        app.listen(PORT, () => {
            logger.info({ port: PORT }, `ResultTrack API running on port ${PORT}`);
        });

    } catch (error) {
        logger.error({ err: error }, "Failed to start server");
        process.exit(1);
    }

}

startServer()