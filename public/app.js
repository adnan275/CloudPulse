document.addEventListener('DOMContentLoaded', () => {
  const connectedNodeText = document.getElementById('connected-node-text');
  const backendName = document.getElementById('backend-name');
  const backendPort = document.getElementById('backend-port');
  const xBackendHeader = document.getElementById('x-backend-header');
  const nodeLatency = document.getElementById('node-latency');
  const nodeAvatar = document.getElementById('node-avatar');
  const edgeDomain = document.getElementById('edge-domain');

  const btnLoadTest = document.getElementById('btn-load-test');
  const lbResults = document.getElementById('lb-results');

  const btnCacheTest = document.getElementById('btn-cache-test');
  const cacheStatusCode = document.getElementById('cache-status-code');
  const cacheHeaderVal = document.getElementById('cache-header-val');
  const cacheEtagVal = document.getElementById('cache-etag-val');
  const cacheJsonPreview = document.getElementById('cache-json-preview');

  edgeDomain.textContent = window.location.hostname || 'app.team1.test';

  fetchStatus();

  async function fetchStatus() {
    const startTime = performance.now();
    try {
      const response = await fetch('/api/status', { cache: 'no-store' });
      const latency = Math.round(performance.now() - startTime);
      const data = await response.json();
      const backendHeader = response.headers.get('X-Backend') || data.backend || 'Unknown';

      updateNodeCard(data.backend, data.port, backendHeader, latency);
    } catch (err) {
      connectedNodeText.textContent = 'Backend Connection Error';
      backendName.textContent = 'Disconnected / Offline';
      console.error(err);
    }
  }

  function updateNodeCard(name, port, headerVal, latency) {
    backendName.textContent = `Node: ${name}`;
    backendPort.textContent = port ? `Port ${port}` : 'N/A';
    xBackendHeader.textContent = `X-Backend: ${headerVal}`;
    nodeLatency.textContent = `${latency} ms`;
    connectedNodeText.textContent = `Active: ${name}`;

    if (name && name.includes('B')) {
      nodeAvatar.textContent = 'B';
      nodeAvatar.classList.add('node-b');
    } else {
      nodeAvatar.textContent = 'A';
      nodeAvatar.classList.remove('node-b');
    }
  }

  // Task D: Load Balancing Test (6x requests)
  btnLoadTest.addEventListener('click', async () => {
    btnLoadTest.disabled = true;
    btnLoadTest.textContent = 'Testing...';
    lbResults.innerHTML = '';

    for (let i = 1; i <= 6; i++) {
      const startTime = performance.now();
      try {
        const isDirectPort = window.location.port === '3001' || window.location.port === '3002';
        const targetUrl = isDirectPort
          ? `http://${window.location.hostname}:${3001 + ((i - 1) % 2)}/api/status`
          : '/api/status';

        const res = await fetch(targetUrl, { cache: 'no-store' });
        const latency = Math.round(performance.now() - startTime);
        const data = await res.json();
        const xBackend = res.headers.get('X-Backend') || data.backend || 'A';

        const row = document.createElement('div');
        const isB = xBackend.includes('B') || xBackend.includes('3002');
        row.className = `result-row ${isB ? 'node-b-row' : ''}`;
        row.innerHTML = `
          <div><strong>Req #${i}:</strong> Served by <span style="color: ${isB ? '#10b981' : '#3b82f6'}">${data.backend}</span></div>
          <div class="result-meta">X-Backend: ${xBackend} | ${latency}ms</div>
        `;
        lbResults.appendChild(row);
      } catch (err) {
        const row = document.createElement('div');
        row.className = 'result-row';
        row.innerHTML = `<div>Req #${i}: Failed to reach backend</div>`;
        lbResults.appendChild(row);
      }
      await new Promise(r => setTimeout(r, 250));
    }

    btnLoadTest.disabled = false;
    btnLoadTest.textContent = 'Run 6x Requests';
  });

  // Task F: HTTP Caching Test
  btnCacheTest.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/data');
      cacheStatusCode.textContent = `${res.status} ${res.statusText}`;
      cacheHeaderVal.textContent = res.headers.get('Cache-Control') || 'max-age=60';
      cacheEtagVal.textContent = res.headers.get('ETag') || 'W/"cloudpulse-v1"';

      const data = await res.json();
      cacheJsonPreview.textContent = JSON.stringify(data, null, 2);
    } catch (err) {
      cacheStatusCode.textContent = 'Error';
      cacheJsonPreview.textContent = '// Failed to fetch /api/data';
    }
  });
});
