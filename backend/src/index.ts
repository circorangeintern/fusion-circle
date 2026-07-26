import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { corsOptions } from "./shared/middlewares/cors";
import sessionHandler from "./shared/middlewares/sessions";
import { globalLimiter } from "./shared/middlewares/rateLimit.middleware"
import { requestLogger } from "./shared/middlewares/requestLogger";
import { setupSwagger } from "./contracts/swagger"
import { errorHandler } from "./shared/middlewares/errorHandler.middleware"
const app = express();
const PORT = process.env.PORT || 5000;
import router from './routes/index';
import pinoHttp from "pino-http";
import { logger } from "./shared/logger";

app.use(requestLogger);
app.use(cors(corsOptions));
app.use(
  pinoHttp({
    logger,
    serializers: {
      req: (req) => ({
        method: req.method,
        url: req.url,
        userAgent: req.headers["user-agent"],
      }),
      res: (res) => ({
        statusCode: res.statusCode,
      }),
    },
    customLogLevel: (req, res, err) => {
      if (err || res.statusCode >= 500) return "error";
      return "info";
    },
  })
);
app.use(express.json());
app.use(globalLimiter);
app.set("trust proxy", 1);
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


app.use(errorHandler);


export default app;

