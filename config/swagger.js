const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

// Metadata options for OpenAPI spec (Aero Core / FastAPI modeled)
const baseOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Aero MVC Core API Docs',
      version: '1.0.0',
      description: 'Interactive RESTful API Explorer for Aero, modeled after FastAPI docs. Test endpoints in real-time by authorizing with a JWT or Personal Access Token.',
      contact: {
        name: 'Aero Core Team'
      }
    },
    servers: [
      {
        url: process.env.APP_URL || `http://localhost:${process.env.PORT || 3001}`,
        description: 'Active Backend API Server'
      },
      {
        url: 'http://localhost:3000',
        description: 'Next.js Frontend Proxy (:3000/api)'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT/Token',
          description: 'Input your Bearer JWT token or personal access token to authorize protected API endpoints.'
        }
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            message: { type: 'string', example: 'Operation completed successfully.' },
            data: { type: 'object' },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'integer', example: 100 },
                per_page: { type: 'integer', example: 15 },
                current_page: { type: 'integer', example: 1 },
                last_page: { type: 'integer', example: 7 },
                has_more: { type: 'boolean', example: true }
              }
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'error' },
            message: { type: 'string', example: 'An error occurred while processing the request.' },
            errors: {
              type: 'object',
              additionalProperties: {
                type: 'array',
                items: { type: 'string' }
              }
            }
          }
        }
      }
    }
  },
  // Files to scan for JSDoc documentation comments
  apis: [
    path.join(__dirname, '../apps/backend/controllers/*.js'),
    path.join(__dirname, '../apps/backend/routes/*.js'),
    path.join(__dirname, '../controllers/*.js'),
    path.join(__dirname, '../routes/*.js'),
    './apps/backend/controllers/*.js',
    './apps/backend/routes/*.js',
    './controllers/*.js',
    './routes/*.js'
  ]
};

// 1. Compile manual JSDoc annotations
let manualSpec = { paths: {}, components: {} };
try {
  manualSpec = swaggerJSDoc(baseOptions);
} catch (e) {
  console.warn('[Swagger] Warning compiling JSDoc:', e.message);
}

// 2. Intelligent Auto-Route Categorizer
function categorizeRoute(pathStr) {
  if (pathStr.includes('/auth') || pathStr === '/api/login') {
    return { tag: 'Authentication', priority: 1 };
  }
  if (pathStr.includes('/user')) {
    return { tag: 'Users', priority: 2 };
  }
  if (pathStr.includes('/dashboard')) {
    return { tag: 'Dashboard', priority: 3 };
  }
  if (pathStr.includes('/expense') || pathStr.includes('/income') || pathStr.includes('/categories') || pathStr.includes('/accounts')) {
    return { tag: 'Vouchers & Accounts', priority: 4 };
  }
  if (pathStr.includes('/customer')) {
    return { tag: 'Customer Khata', priority: 5 };
  }
  if (pathStr.includes('/supplier')) {
    return { tag: 'Supplier Khata', priority: 6 };
  }
  if (pathStr.includes('/daily-sheet')) {
    return { tag: 'Daily Sheets', priority: 7 };
  }
  if (pathStr.includes('/employee') || pathStr.includes('/salar') || pathStr.includes('/advance')) {
    return { tag: 'HR & Payroll', priority: 8 };
  }
  if (pathStr.includes('/attendance')) {
    return { tag: 'Attendance', priority: 9 };
  }
  if (pathStr.includes('/transfer') || pathStr.includes('/daily-closing') || pathStr.includes('/cashbook')) {
    return { tag: 'Cashbook & Closings', priority: 10 };
  }
  if (pathStr.includes('/report')) {
    return { tag: 'Reports', priority: 11 };
  }
  if (pathStr.includes('/shop')) {
    return { tag: 'Shop Management', priority: 12 };
  }
  if (pathStr.includes('/template') || pathStr.includes('/setting')) {
    return { tag: 'Settings & Templates', priority: 13 };
  }
  if (pathStr.includes('/ai/')) {
    return { tag: 'Gemini AI', priority: 14 };
  }
  return { tag: 'System & Health', priority: 15 };
}

function generateSummary(method, pathStr) {
  const parts = pathStr.split('/').filter(Boolean);
  const resource = parts[parts.length - 1] || 'resource';
  const cleanRes = resource.replace(/[{}]/g, '').replace(/[-_]/g, ' ');

  if (pathStr === '/api/status') return 'Check API server online status';
  if (pathStr === '/api/health') return 'Service health check and uptime probe';
  if (pathStr === '/api/ai/ask') return 'Query Gemini AI assistant with natural language';
  if (pathStr === '/api/ai/summarize') return 'Generate executive business & financial summary with AI';
  if (pathStr === '/api/login') return 'Authenticate credentials and issue Personal Access Token';

  switch (method.toUpperCase()) {
    case 'GET':
      if (pathStr.includes('{id}') || pathStr.includes('{ledgerId}')) {
        return `Fetch single ${cleanRes} record details`;
      }
      return `List and filter ${cleanRes} records with pagination`;
    case 'POST':
      return `Create new ${cleanRes} record`;
    case 'PUT':
      return `Update existing ${cleanRes} record`;
    case 'DELETE':
      return `Delete ${cleanRes} record from database`;
    default:
      return `${method.toUpperCase()} ${pathStr}`;
  }
}

function getSamplePayload(pathStr) {
  if (pathStr.includes('/login')) {
    return {
      type: 'object',
      required: ['username', 'password'],
      properties: {
        username: { type: 'string', example: 'admin' },
        password: { type: 'string', example: 'admin123' },
        token_name: { type: 'string', example: 'API Token' }
      }
    };
  }
  if (pathStr.includes('/ai/ask')) {
    return {
      type: 'object',
      required: ['prompt'],
      properties: {
        prompt: { type: 'string', example: 'What were the total expenses and highest spending categories this month?' },
        context: { type: 'string', example: 'ERP Financial Summary' }
      }
    };
  }
  if (pathStr.includes('/ai/summarize')) {
    return {
      type: 'object',
      required: ['metrics'],
      properties: {
        metrics: {
          type: 'object',
          example: { totalRevenue: 285000, totalExpense: 142000, netCashflow: 143000, pendingReceivables: 45000 }
        }
      }
    };
  }
  if (pathStr.includes('/expenses')) {
    return {
      type: 'object',
      required: ['category_id', 'account_id', 'amount'],
      properties: {
        category_id: { type: 'integer', example: 1 },
        account_id: { type: 'integer', example: 1 },
        amount: { type: 'number', example: 2500.00 },
        note: { type: 'string', example: 'Office utility and supplies' },
        date: { type: 'string', format: 'date', example: '2026-09-06' }
      }
    };
  }
  if (pathStr.includes('/incomes')) {
    return {
      type: 'object',
      required: ['category_id', 'account_id', 'amount'],
      properties: {
        category_id: { type: 'integer', example: 2 },
        account_id: { type: 'integer', example: 1 },
        amount: { type: 'number', example: 45000.00 },
        note: { type: 'string', example: 'Client project consulting fee' },
        date: { type: 'string', format: 'date', example: '2026-09-06' }
      }
    };
  }
  if (pathStr.includes('/customers') && pathStr.includes('/transaction')) {
    return {
      type: 'object',
      required: ['amount', 'type'],
      properties: {
        type: { type: 'string', enum: ['debit', 'credit'], example: 'credit' },
        amount: { type: 'number', example: 5000.00 },
        note: { type: 'string', example: 'Khata due settlement payment' },
        date: { type: 'string', format: 'date', example: '2026-09-06' }
      }
    };
  }
  if (pathStr.includes('/customers')) {
    return {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', example: 'Rahim Brothers Traders' },
        phone: { type: 'string', example: '01711223344' },
        email: { type: 'string', example: 'rahim@example.com' },
        address: { type: 'string', example: 'Dhaka, Bangladesh' },
        opening_balance: { type: 'number', example: 5000.00 }
      }
    };
  }
  if (pathStr.includes('/suppliers')) {
    return {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', example: 'Apex Logistics Ltd' },
        phone: { type: 'string', example: '01811223344' },
        company: { type: 'string', example: 'Apex Group' },
        opening_balance: { type: 'number', example: 15000.00 }
      }
    };
  }
  if (pathStr.includes('/transfers')) {
    return {
      type: 'object',
      required: ['from_account_id', 'to_account_id', 'amount'],
      properties: {
        from_account_id: { type: 'integer', example: 1 },
        to_account_id: { type: 'integer', example: 2 },
        amount: { type: 'number', example: 10000.00 },
        note: { type: 'string', example: 'Petty cash replenishment' },
        date: { type: 'string', format: 'date', example: '2026-09-06' }
      }
    };
  }
  if (pathStr.includes('/users')) {
    return {
      type: 'object',
      required: ['name', 'username', 'password', 'role'],
      properties: {
        name: { type: 'string', example: 'Manager User' },
        username: { type: 'string', example: 'manager1' },
        email: { type: 'string', example: 'manager@aeromvc.dev' },
        password: { type: 'string', example: 'secret123' },
        role: { type: 'string', enum: ['admin', 'manager', 'staff'], example: 'manager' }
      }
    };
  }
  return {
    type: 'object',
    properties: {
      name: { type: 'string', example: 'Sample Item' },
      note: { type: 'string', example: 'Optional remarks' }
    }
  };
}

// 3. Auto-build full OpenAPI paths from Express Routers
function generateAutoSwaggerSpec() {
  const mergedPaths = { ...manualSpec.paths };

  let apiRouter, authRouter;
  try {
    apiRouter = require('./apps/backend/routes/api');
  } catch (e) {
    try { apiRouter = require('../apps/backend/routes/api'); } catch (err) {
      try { apiRouter = require('./routes/api'); } catch (e2) {}
    }
  }
  try {
    authRouter = require('./apps/backend/routes/auth');
  } catch (e) {
    try { authRouter = require('../apps/backend/routes/auth'); } catch (err) {
      try { authRouter = require('./routes/auth'); } catch (e2) {}
    }
  }

  const routersToScan = [
    { prefix: '/api', router: apiRouter },
    { prefix: '/api/auth', router: authRouter }
  ];

  routersToScan.forEach(({ prefix, router }) => {
    if (!router || !router.stack) return;

    router.stack.forEach(layer => {
      if (!layer.route) return;

      const subPath = layer.route.path;
      const rawFullPath = (prefix + subPath).replace(/\/+/g, '/');
      const openApiPath = rawFullPath.replace(/:([a-zA-Z0-9_]+)/g, '{$1}');

      const methods = Object.keys(layer.route.methods);
      const middlewares = layer.route.stack.map(s => s.name);
      const isProtected = middlewares.includes('apiTokenAuth') || middlewares.includes('auth') || middlewares.includes('jwtAuth');

      if (!mergedPaths[openApiPath]) {
        mergedPaths[openApiPath] = {};
      }

      methods.forEach(method => {
        if (mergedPaths[openApiPath][method]) {
          return;
        }

        const { tag } = categorizeRoute(openApiPath);
        const summary = generateSummary(method, openApiPath);

        const pathParams = [];
        const paramMatches = rawFullPath.match(/:([a-zA-Z0-9_]+)/g) || [];
        paramMatches.forEach(p => {
          const paramName = p.replace(':', '');
          pathParams.push({
            name: paramName,
            in: 'path',
            required: true,
            schema: {
              type: paramName.toLowerCase().includes('id') ? 'integer' : 'string'
            },
            description: `Identifier for ${paramName}`
          });
        });

        const queryParams = [];
        if (method.toUpperCase() === 'GET') {
          if (!openApiPath.includes('{id}')) {
            queryParams.push(
              { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Page number' },
              { name: 'per_page', in: 'query', schema: { type: 'integer', default: 15 }, description: 'Items per page' },
              { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Keyword search filter' }
            );
          }
          if (openApiPath.includes('report') || openApiPath.includes('attendance') || openApiPath.includes('daily-')) {
            queryParams.push(
              { name: 'start_date', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Start date filter (YYYY-MM-DD)' },
              { name: 'end_date', in: 'query', schema: { type: 'string', format: 'date' }, description: 'End date filter (YYYY-MM-DD)' }
            );
          }
        }

        const operation = {
          summary,
          description: `${summary}.`,
          tags: [tag],
          parameters: [...pathParams, ...queryParams],
          responses: {
            '200': {
              description: 'Successful Response',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            },
            '400': {
              description: 'Bad Request / Invalid Payload',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' }
                }
              }
            },
            ...(isProtected ? {
              '401': {
                description: 'Unauthorized. Bearer access token missing or invalid.'
              }
            } : {}),
            '422': {
              description: 'Validation Error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' }
                }
              }
            },
            '500': {
              description: 'Internal Server Error'
            }
          }
        };

        if (isProtected) {
          operation.security = [{ bearerAuth: [] }];
        }

        if (['post', 'put', 'patch'].includes(method.toLowerCase())) {
          operation.requestBody = {
            required: true,
            content: {
              'application/json': {
                schema: getSamplePayload(openApiPath)
              }
            }
          };
        }

        mergedPaths[openApiPath][method] = operation;
      });
    });
  });

  return {
    ...baseOptions.definition,
    components: {
      ...baseOptions.definition.components,
      ...(manualSpec.components || {})
    },
    paths: mergedPaths
  };
}

const swaggerSpec = generateAutoSwaggerSpec();

module.exports = {
  swaggerUi,
  swaggerSpec,
  generateAutoSwaggerSpec
};
