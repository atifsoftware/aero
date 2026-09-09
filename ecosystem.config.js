/**
 * Aero MVC - Production PM2 Process Manager Configuration
 * 
 * Usage:
 *   Build first:
 *     npm run build
 * 
 *   Start all services:
 *     pm2 start ecosystem.config.js
 * 
 *   Monitor:
 *     pm2 status
 *     pm2 logs
 */
module.exports = {
  apps: [
    {
      name: 'aero-backend',
      cwd: './apps/backend',
      script: 'server.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    },
    {
      name: 'aero-frontend',
      cwd: './apps/web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
