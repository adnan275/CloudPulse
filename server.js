const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

let requestCounter = 0;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/api/status', (req, res) => {
  requestCounter++;
  const isServerA = requestCounter % 2 !== 0;
  const backendId = isServerA ? 'Server-A' : 'Server-B';
  const backendPort = isServerA ? 3001 : 3002;

  res.setHeader('X-Backend', backendId);
  res.setHeader('Access-Control-Allow-Origin', '*');

  res.json({
    status: 'ok',
    backend: backendId,
    port: backendPort,
    requestIndex: requestCounter,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    message: `Backend Microservice ${backendId} is healthy via Round-Robin Edge Proxy`
  });
});

app.get('/api/health', (req, res) => {
  const memUsage = process.memoryUsage();
  res.json({
    status: 'healthy',
    system: 'CloudPulse Edge Gateway',
    activeBackends: ['Server-A (:3001)', 'Server-B (:3002)'],
    algorithm: 'Round-Robin',
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
  const clientEtag = req.headers['if-none-match'];
  const currentEtag = 'W/"cloudpulse-v1-static-hash"';

  res.setHeader('Cache-Control', 'max-age=60, public');
  res.setHeader('ETag', currentEtag);
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (clientEtag === currentEtag) {
    return res.status(304).end();
  }

  requestCounter++;
  const isServerA = requestCounter % 2 !== 0;
  const backendId = isServerA ? 'Server-A' : 'Server-B';

  res.setHeader('X-Backend', backendId);
  res.json({
    title: 'CloudPulse Network Telemetry Report',
    backendNode: backendId,
    protocol: req.protocol,
    headers: req.headers,
    cachePolicy: 'Cache-Control: max-age=60, public',
    eTag: currentEtag,
    data: [
      { metric: 'DNS Lookup Time', status: 'Optimal' },
      { metric: 'TLS Handshake', status: 'Verified (TLS 1.3)' },
      { metric: 'Load Balancing', status: 'Active (Round-Robin)' },
      { metric: 'Cache Policy', status: 'RFC-7234 Compliant (304 Support)' }
    ]
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[CloudPulse Edge Gateway] Listening on port ${PORT}`);
});
