const fs = require('node:fs');
const path = require('node:path');

// Resolve the listen port from local-usage.config.json (optional), falling back to
// 3002. This CommonJS file is evaluated by PM2 at launch — outside the Next.js
// /TypeScript runtime — so it cannot use src/lib/config.ts's getPort(); the port
// validation here mirrors sanitizePort() there.
function resolvePort() {
  try {
    const text = fs.readFileSync(path.join(__dirname, 'local-usage.config.json'), 'utf8');
    // Strip a leading UTF-8 BOM (Windows / PowerShell Out-File adds one) before parsing.
    const raw = JSON.parse(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text);
    const p = raw && raw.port;
    if (typeof p === 'number' && Number.isInteger(p) && p > 0 && p < 65536) return p;
  } catch {
    // missing file / invalid JSON / no valid port → default
  }
  return 3002;
}

const PORT = resolvePort();

module.exports = {
  apps: [
    {
      name: 'local-usage',
      script: 'node_modules/next/dist/bin/next',
      args: `start -p ${PORT}`,
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
