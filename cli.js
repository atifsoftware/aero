/**
 * Aero MVC Root CLI Runner
 * Spawns apps/backend/cli.js with inherited stdio
 */
const { fork } = require('child_process');
const path = require('path');

const target = path.join(__dirname, 'apps', 'backend', 'cli.js');
const child = fork(target, process.argv.slice(2), {
  stdio: 'inherit',
  cwd: path.join(__dirname, 'apps', 'backend')
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
