import dotenv from "dotenv";
dotenv.config();

import express from "express";
import sessionHandler from "./shared/middlewares/sessions";
import { globalLimiter } from "./shared/middlewares/rateLimit.middleware"
import { setupSwagger } from "./contracts/swagger"

const app = express();
const PORT = process.env.PORT || 5000;
import router from './routes/index';

app.use(express.json());
app.use(globalLimiter);
app.use(sessionHandler);

// Swagger
setupSwagger(app);


// Root endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    project: "ResultTrack API",
    version: process.env.npm_package_version || "1.0.0",
    status: "Active",
    api_root: "/api/v1",
    description: "Automated CA and exam result computation system",
    team: "Fusion Circle",
  });
});

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
  });
});

// API routes
app.use("/api/v1", router);

// Catch unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found.`,
  });
});


// if (process.env.NODE_ENV !== "test") {
//   app.listen(PORT, () => {
//     console.log(` ResultTrack API running on port ${PORT}`);
//   });
// }

export default app;



// // src/app.ts
// import express from 'express';

// import { errorMiddleware } from './middleware/error.middleware';

// const app = express();
// app.use(express.json());
// app.use(cookieParser()); // needed since sessions are cookie-based



// app.use(errorMiddleware); // always last

// export default app;