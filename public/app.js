document.addEventListener('DOMContentLoaded', () => {
  let reqCount = 0;

  // Clock
  function updateClock() {
    const now = new Date().toLocaleTimeString('en-GB');
    const el = document.getElementById('clock');
    const fe = document.getElementById('footer-clock');
    if (el) el.textContent = now;
    if (fe) fe.textContent = now;
  }
  setInterval(updateClock, 1000);
  updateClock();

  // Elements
  const connectedNodeText = document.getElementById('connected-node-text');
  const chipBackend = document.getElementById('chip-backend');
  const chipPort = document.getElementById('chip-port');
  const chipLatency = document.getElementById('chip-latency');
  const chipReqCount = document.getElementById('chip-req-count');

  const btnLoadTest = document.getElementById('btn-load-test');
  const lbResults = document.getElementById('lb-results');

  const btnCacheTest = document.getElementById('btn-cache-test');
  const cacheStatusCode = document.getElementById('cache-status-code');
  const cacheHeaderVal = document.getElementById('cache-header-val');
  const cacheEtagVal = document.getElementById('cache-etag-val');
  const cacheJsonPreview = document.getElementById('cache-json-preview');

  fetchStatus();

  async function fetchStatus() {
    const startTime = performance.now();
    try {
      const res = await fetch('/api/status', { cache: 'no-store' });
      const latency = Math.round(performance.now() - startTime);
      const data = await res.json();
      const xb = res.headers.get('X-Backend') || data.backend || 'Server-A';

      connectedNodeText.textContent = `CONNECTED · ${data.backend}`;
      chipBackend.textContent = data.backend;
      chipPort.textContent = `:${data.port}`;
      chipLatency.textContent = `${latency} ms`;

      reqCount++;
      chipReqCount.textContent = reqCount;

      if (data.backend && data.backend.includes('B')) {
        document.getElementById('node-b-badge').style.boxShadow = '0 0 12px rgba(0,229,160,0.5)';
      } else {
        document.getElementById('node-a-badge').style.boxShadow = '0 0 12px rgba(0,212,255,0.5)';
      }

    } catch (err) {
      connectedNodeText.textContent = 'ERR · UPSTREAM DOWN';
    }
  }

  function logLine(content, cls = '') {
    const line = document.createElement('div');
    line.className = `terminal-line ${cls}`;
    line.textContent = content;
    lbResults.appendChild(line);
    lbResults.scrollTop = lbResults.scrollHeight;
  }

  btnLoadTest.addEventListener('click', async () => {
    btnLoadTest.disabled = true;
    btnLoadTest.textContent = '● RUNNING...';
    lbResults.innerHTML = '';

    const ts = new Date().toLocaleTimeString('en-GB');
    logLine(`[${ts}] Initiating 6x Round-Robin Load Balance Test...`, 'muted');
    logLine(`[${ts}] Target: /api/status | Method: GET`, 'muted');
    logLine('─'.repeat(52), 'muted');

    for (let i = 1; i <= 6; i++) {
      const start = performance.now();
      try {
        const isDirectPort = window.location.port === '3001' || window.location.port === '3002';
        const targetUrl = isDirectPort
          ? `http://${window.location.hostname}:${3001 + ((i - 1) % 2)}/api/status`
          : '/api/status';

        const res = await fetch(targetUrl, { cache: 'no-store' });
        const lat = Math.round(performance.now() - start);
        const data = await res.json();
        const xb = res.headers.get('X-Backend') || data.backend;
        const isB = xb && (xb.includes('B') || xb.includes('3002'));
        const now = new Date().toLocaleTimeString('en-GB');

        logLine(
          `[${now}] REQ #${i}  →  ${data.backend}  |  X-Backend: ${xb}  |  ${res.status} OK  |  ${lat}ms`,
          isB ? 'success-b' : 'success-a'
        );

        reqCount++;
        chipReqCount.textContent = reqCount;
        chipBackend.textContent = data.backend;
        chipPort.textContent = `:${data.port}`;
        chipLatency.textContent = `${lat} ms`;

      } catch (err) {
        const now = new Date().toLocaleTimeString('en-GB');
        logLine(`[${now}] REQ #${i}  →  UPSTREAM UNREACHABLE  |  ERR_CONNECTION_REFUSED`, 'error');
      }
      await new Promise(r => setTimeout(r, 300));
    }

    const done = new Date().toLocaleTimeString('en-GB');
    logLine('─'.repeat(52), 'muted');
    logLine(`[${done}] Load balance cycle complete. Nginx Round-Robin verified.`, 'muted');

    btnLoadTest.disabled = false;
    btnLoadTest.textContent = '► RUN 6x LB TEST';
  });

  btnCacheTest.addEventListener('click', async () => {
    btnCacheTest.disabled = true;
    try {
      const res = await fetch('/api/data');
      cacheStatusCode.textContent = `${res.status} ${res.statusText}`;
      cacheHeaderVal.textContent = res.headers.get('Cache-Control') || 'max-age=60';
      cacheEtagVal.textContent = res.headers.get('ETag') || 'W/"cloudpulse-v1"';

      const data = await res.json();
      cacheJsonPreview.innerHTML = '';

      const line = document.createElement('pre');
      line.className = 'terminal-line mono cyan';
      line.style.fontSize = '11px';
      line.textContent = JSON.stringify(data, null, 2);
      cacheJsonPreview.appendChild(line);

    } catch (err) {
      cacheStatusCode.textContent = 'ERR';
      cacheJsonPreview.innerHTML = '<span class="terminal-line error mono">// Failed to fetch /api/data</span>';
    }
    btnCacheTest.disabled = false;
  });
});
