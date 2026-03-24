import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './storage/db';
import employeeRoutes from './routes/employees';
import teamRoutes from './routes/teams';
import taskRoutes from './routes/tasks';
import memoryRoutes from './routes/memories';
import conversationRoutes from './routes/conversations';
import engineRoutes from './routes/engine';

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
app.use('/api/employees', memoryRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/engine', engineRoutes);

app.listen(PORT, () => {
  console.log(`AI-WorkHub Backend running on port ${PORT}`);
  // Optionally auto-start the task engine
  if (process.env.AUTO_START_ENGINE === 'true') {
    import('./engine').then(({ taskEngine }) => {
      taskEngine.start();
      console.log('[TaskEngine] Auto-started via AUTO_START_ENGINE=true');
    });
  }
});

export default app;
