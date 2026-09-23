const express = require('express');
const cors = require('cors');

const healthRoutes = require('./routes/health');
const scanRoutes = require('./routes/scans');
const targetsRoutes = require('./routes/targets');

const { errorHandler } = require('./middleware/error-handler');
const { notFoundHandler } = require('./middleware/not-found.ts');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/health', healthRoutes);
app.use('/scans', scanRoutes);
app.use('/targets', targetsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
