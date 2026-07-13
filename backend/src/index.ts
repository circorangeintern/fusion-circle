import dotenv from 'dotenv';
dotenv.config();
import express from 'express';


const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', nodeVersion: process.version });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

export default app;
