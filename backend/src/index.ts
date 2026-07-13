import dotenv from 'dotenv';
dotenv.config();
import express from 'express';


const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', nodeVersion: process.version });
});

app.get("/info", (req, res) => {
  res.json({
    api: 'ResultTrack',
    project_team: 'Fusion Circle',
    version: process.env.npm_package_version || '1.0.0',
    description: 'Automated CA and exam result computation system',
    status: 'in development',
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

export default app;
