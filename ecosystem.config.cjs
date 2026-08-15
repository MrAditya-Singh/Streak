module.exports = {
  apps: [
    {
      name: 'effstreak-backend',
      script: './backend/src/server.js',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        CORS_ORIGIN: '*',
      },
    },
  ],
};
