import express from 'express';
import cors from 'cors';

import healthRoutes from './routes/health.js';
import scanRoutes from './routes/scans.js';
import targetsRoutes from './routes/targets.js';

import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/health', healthRoutes);
app.use('/scans', scanRoutes);
app.use('/targets', targetsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
