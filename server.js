/**
 * Aero MVC Server Gateway
 * 
 * In this monorepo architecture, the Express 5 MVC backend engine resides in `apps/backend`.
 * This root entry point initializes the environment and delegates execution cleanly to
 * `apps/backend/server.js`.
 */
const path = require('path');

// Change working directory to apps/backend so all relative assets, storage, views resolve correctly
process.chdir(path.join(__dirname, 'apps', 'backend'));

// Boot the backend engine
require('./apps/backend/server');
