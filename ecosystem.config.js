module.exports = {
  apps: [
    {
      name: 'ai-usage',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3002',
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
