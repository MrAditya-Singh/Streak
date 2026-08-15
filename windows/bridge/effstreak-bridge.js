/**
 * EffStreak Windows Local State Daemon & Bridge
 * Reads synced data from Firebase or Local Web Hub and updates
 * %LOCALAPPDATA%/EffStreak/state.json for Rainmeter.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');

const appDataDir = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
const effstreakDir = path.join(appDataDir, 'EffStreak');
const stateFilePath = path.join(effstreakDir, 'state.json');

if (!fs.existsSync(effstreakDir)) {
  fs.mkdirSync(effstreakDir, { recursive: true });
}

// Initial state snapshot
const defaultState = {
  overallStreak: 97,
  isActiveToday: true,
  tasksDone: 5,
  totalTasks: 7,
  efficiencyPct: 82,
  level: 18,
  hunterRank: 'A',
  platforms: {
    leetcode: { streak: 42, completed: true },
    codeforces: { streak: 18, completed: true },
    gfg: { streak: 31, completed: true },
    github: { streak: 26, completed: true },
    youtube: { streak: 12, completed: false },
    project: { streak: 9, completed: false }
  },
  lastUpdated: new Date().toISOString()
};

fs.writeFileSync(stateFilePath, JSON.stringify(defaultState, null, 2), 'utf-8');
console.log(`[EffStreak Bridge] Local desktop state initialized at: ${stateFilePath}`);

// Local lightweight HTTP sync listener for Web Hub
const PORT = process.env.PORT || 8765;
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/sync') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        fs.writeFileSync(stateFilePath, JSON.stringify(payload, null, 2), 'utf-8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', writtenTo: stateFilePath }));
        console.log(`[EffStreak Bridge] State updated from client at ${new Date().toLocaleTimeString()}`);
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  } else if (req.method === 'GET' && req.url === '/state') {
    const raw = fs.readFileSync(stateFilePath, 'utf-8');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(raw);
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`[EffStreak Bridge] Listening for Web Hub sync events on http://localhost:${PORT}`);
});
