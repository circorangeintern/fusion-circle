import app from "./index";
import dotenv from "dotenv";
import { connectDB } from "./shared/prisma/prisma";

dotenv.config();

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`ResultTrack API running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }

}

startServer()