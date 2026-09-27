const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const BACKEND_ID = 'Server-A';

app.use((req, res, next) => {
  res.setHeader('X-Backend', BACKEND_ID);
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    backend: BACKEND_ID,
    port: PORT,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    message: 'Backend Service A is healthy'
  });
});

app.get('/api/health', (req, res) => {
  const memUsage = process.memoryUsage();
  res.json({
    status: 'healthy',
    backendNode: BACKEND_ID,
    port: PORT,
    platform: process.platform,
    nodeVersion: process.version,
    uptimeSeconds: Math.floor(process.uptime()),
    memoryMB: {
      rss: (memUsage.rss / 1024 / 1024).toFixed(2),
      heapUsed: (memUsage.heapUsed / 1024 / 1024).toFixed(2)
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/api/data', (req, res) => {
  res.setHeader('Cache-Control', 'max-age=60, public');
  res.setHeader('ETag', 'W/"cloudpulse-v1-static-hash"');
  
  res.json({
    title: 'CloudPulse Network Telemetry Report',
    backendNode: BACKEND_ID,
    protocol: req.protocol,
    headers: req.headers,
    cachePolicy: 'Cache-Control: max-age=60',
    data: [
      { metric: 'DNS Lookup Time', status: 'Optimal' },
      { metric: 'TLS Handshake', status: 'Verified' },
      { metric: 'Load Balancing', status: 'Active (Round-Robin)' }
    ]
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Backend A] Running on http://0.0.0.0:${PORT} (${BACKEND_ID})`);
});
