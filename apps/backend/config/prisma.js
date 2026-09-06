const { PrismaClient } = require('@prisma/client');

/**
 * NodeFlow Prisma Client Singleton
 * Co-exists seamlessly with Custom Fluent Query Builder (config/db.js).
 */
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

module.exports = prisma;
