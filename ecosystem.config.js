module.exports = {
  apps: [
    {
      name: 'cbcc-server',
      cwd: './server',
      script: 'dist/src/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
    },
  ],
};
