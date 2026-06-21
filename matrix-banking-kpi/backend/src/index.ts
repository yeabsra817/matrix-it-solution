import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { testConnection } from './db';

import authRoutes from './routes/auth';
import bankRoutes from './routes/banks';
import orgRoutes from './routes/organization';
import userRoutes from './routes/users';
import kpiRoutes from './routes/kpi';
import entryRoutes from './routes/entries';
import dashboardRoutes from './routes/dashboard';
import reportRoutes from './routes/reports';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', async (_req, res) => {
  try {
    const dbOk = await testConnection();
    res.json({
      success: true,
      status: 'ok',
      database: dbOk ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({
      success: false,
      status: 'error',
      message: 'Something went wrong, please try again',
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/banks', bankRoutes);
app.use('/api/organization', orgRoutes);
app.use('/api/users', userRoutes);
app.use('/api/kpi', kpiRoutes);
app.use('/api/entries', entryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Something went wrong, please try again',
  });
});

app.listen(config.port, '0.0.0.0', () => {
  console.log(`Matrix Banking KPI API running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`CORS origins: ${config.corsOrigins.join(', ')}`);
});

export default app;
