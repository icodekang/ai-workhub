import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './storage/db';
import employeeRoutes from './routes/employees';
import teamRoutes from './routes/teams';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize database
initDb();

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Register API routes
app.use('/api/employees', employeeRoutes);
app.use('/api/teams', teamRoutes);

app.listen(PORT, () => {
  console.log(`AI-WorkHub Backend running on port ${PORT}`);
});

export default app;
