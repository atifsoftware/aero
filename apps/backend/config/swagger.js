const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

// Base OpenAPI 3.0 Definition
const baseOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Aero Enterprise API Explorer',
      version: '1.0.0',
      description: `
### 🚀 Welcome to the Aero Enterprise API Portal
This API documentation is **automatically generated** from the Express 5 MVC router stack and synchronized with manual OpenAPI annotations.

#### 🔑 Authentication
Protected endpoints require a **Bearer Token** (Personal Access Token or JWT).
Click the **Authorize 🔓** button below and enter:
\`\`\`text
Bearer <YOUR_ACCESS_TOKEN>
\`\`\`
*(Tip: In Aero MVC, you can obtain a token via \`POST /api/login\` or by running \`node cli.js\`)*
      `,
      contact: {
        name: 'Aero Engineering Team',
        url: 'http://localhost:3000',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      }
    },
    servers: [
      {
        url: process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`,
        description: 'Active Aero Backend Server'
      },
      {
        url: 'http://localhost:3000',
        description: 'Next.js 14 Reverse Proxy (:3000/api)'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'Token / JWT',
          description: 'Enter your Personal Access Token or JWT to access protected endpoints.'
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
  apis: [
    path.join(__dirname, '../controllers/*.js'),
    path.join(__dirname, '../routes/*.js')
  ]
};

// 1. Compile manual JSDoc annotations
let manualSpec = { paths: {}, components: {} };
try {
  manualSpec = swaggerJSDoc(baseOptions);
} catch (e) {
  console.warn('[Swagger] Warning compiling JSDoc:', e.message);
}

// 2. Intelligent Auto-Route Categorizer and Schema Builder
function categorizeRoute(pathStr) {
  if (pathStr.includes('/auth') || pathStr === '/api/login') {
    return { tag: '🔐 Authentication & Access', priority: 1 };
  }
  if (pathStr.includes('/user')) {
    return { tag: '👤 User Management', priority: 2 };
  }
  if (pathStr.includes('/dashboard')) {
    return { tag: '📊 Dashboard & Analytics', priority: 3 };
  }
  if (pathStr.includes('/expense') || pathStr.includes('/income') || pathStr.includes('/categories') || pathStr.includes('/accounts')) {
    return { tag: '🧾 Vouchers & Accounts', priority: 4 };
  }
  if (pathStr.includes('/customer')) {
    return { tag: '👥 Customer Tally Khata', priority: 5 };
  }
  if (pathStr.includes('/supplier')) {
    return { tag: '🏢 Supplier Mahajon Khata', priority: 6 };
  }
  if (pathStr.includes('/daily-sheet')) {
    return { tag: '📅 Daily Sheets & Khata', priority: 7 };
  }
  if (pathStr.includes('/employee') || pathStr.includes('/salar') || pathStr.includes('/advance')) {
    return { tag: '👔 HR & Payroll', priority: 8 };
  }
  if (pathStr.includes('/attendance')) {
    return { tag: '⏱️ Attendance System', priority: 9 };
  }
  if (pathStr.includes('/transfer') || pathStr.includes('/daily-closing') || pathStr.includes('/cashbook')) {
    return { tag: '🏦 Cashbook & Closings', priority: 10 };
  }
  if (pathStr.includes('/report')) {
    return { tag: '📈 Financial Reports', priority: 11 };
  }
  if (pathStr.includes('/shop')) {
    return { tag: '🏪 Shop Management', priority: 12 };
  }
  if (pathStr.includes('/template') || pathStr.includes('/setting')) {
    return { tag: '⚙️ Settings & Templates', priority: 13 };
  }
  if (pathStr.includes('/ai/')) {
    return { tag: '🤖 Google Gemini AI', priority: 14 };
  }
  return { tag: '⚡ System & Health', priority: 15 };
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
        email: { type: 'string', example: 'manager@nodeflow.com' },
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

  const routersToScan = [
    { prefix: '/api', router: require('../routes/api') },
    { prefix: '/api/auth', router: require('../routes/auth') }
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
        // If developer already defined manual JSDoc on this method/path, preserve it!
        if (mergedPaths[openApiPath][method]) {
          return;
        }

        const { tag } = categorizeRoute(openApiPath);
        const summary = generateSummary(method, openApiPath);

        // Path parameters extraction
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

        // Query parameters for GET endpoints
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
          description: `${summary}. Processed dynamically by NodeFlow MVC Core with query builder speed.`,
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
              description: 'Validation Error (Unprocessable Entity)',
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

// Sleek Custom Dark Cyber Theme CSS for Swagger UI
const customCss = `
  body {
    background-color: #0a0e17 !important;
    color: #e2e8f0 !important;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  }
  .swagger-ui {
    background-color: #0a0e17 !important;
  }
  .swagger-ui .topbar {
    background-color: #0f172a !important;
    border-bottom: 1px solid #1e293b !important;
    padding: 12px 0 !important;
  }
  .swagger-ui .topbar .download-url-wrapper {
    display: none !important;
  }
  .swagger-ui .topbar-wrapper img {
    content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2338bdf8'%3E%3Cpath d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'/%3E%3C/svg%3E");
    width: 28px !important;
    height: 28px !important;
  }
  .swagger-ui .info {
    margin: 30px 0 !important;
  }
  .swagger-ui .info .title {
    color: #38bdf8 !important;
    font-weight: 800 !important;
    letter-spacing: -0.5px !important;
  }
  .swagger-ui .info p, .swagger-ui .info li {
    color: #94a3b8 !important;
  }
  .swagger-ui .scheme-container {
    background-color: #0f172a !important;
    border: 1px solid #1e293b !important;
    border-radius: 10px !important;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important;
    margin: 20px 0 !important;
    padding: 15px 20px !important;
  }
  .swagger-ui .opblock-tag {
    color: #f1f5f9 !important;
    border-bottom: 1px solid #1e293b !important;
    font-size: 1.15rem !important;
    font-weight: 700 !important;
    padding: 14px 0 !important;
  }
  .swagger-ui .opblock {
    border-radius: 8px !important;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
    margin-bottom: 12px !important;
    border: 1px solid #1e293b !important;
    background: #0f172a !important;
  }
  .swagger-ui .opblock .opblock-summary-path {
    color: #f8fafc !important;
    font-weight: 600 !important;
  }
  .swagger-ui .opblock .opblock-summary-description {
    color: #94a3b8 !important;
  }
  .swagger-ui .opblock.opblock-get {
    border-color: rgba(16, 185, 129, 0.3) !important;
    background: rgba(16, 185, 129, 0.04) !important;
  }
  .swagger-ui .opblock.opblock-get .opblock-summary-method {
    background: #10b981 !important;
  }
  .swagger-ui .opblock.opblock-post {
    border-color: rgba(56, 189, 248, 0.3) !important;
    background: rgba(56, 189, 248, 0.04) !important;
  }
  .swagger-ui .opblock.opblock-post .opblock-summary-method {
    background: #0284c7 !important;
  }
  .swagger-ui .opblock.opblock-put {
    border-color: rgba(245, 158, 11, 0.3) !important;
    background: rgba(245, 158, 11, 0.04) !important;
  }
  .swagger-ui .opblock.opblock-put .opblock-summary-method {
    background: #d97706 !important;
  }
  .swagger-ui .opblock.opblock-delete {
    border-color: rgba(239, 68, 68, 0.3) !important;
    background: rgba(239, 68, 68, 0.04) !important;
  }
  .swagger-ui .opblock.opblock-delete .opblock-summary-method {
    background: #dc2626 !important;
  }
  .swagger-ui .btn.authorize {
    background: linear-gradient(135deg, #0284c7, #0369a1) !important;
    color: #ffffff !important;
    border-color: transparent !important;
    border-radius: 8px !important;
    font-weight: 600 !important;
  }
  .swagger-ui .btn.authorize svg {
    fill: #ffffff !important;
  }
  .swagger-ui .btn.execute {
    background: #0284c7 !important;
    border-color: transparent !important;
    color: #ffffff !important;
    border-radius: 6px !important;
  }
  .swagger-ui select, .swagger-ui input[type=text] {
    background: #1e293b !important;
    color: #f8fafc !important;
    border: 1px solid #334155 !important;
    border-radius: 6px !important;
  }
  .swagger-ui .model-box, .swagger-ui section.models {
    background-color: #0f172a !important;
    border: 1px solid #1e293b !important;
    border-radius: 8px !important;
  }
  .swagger-ui .model-title {
    color: #38bdf8 !important;
  }
  .swagger-ui table thead tr th, .swagger-ui table thead tr td {
    color: #cbd5e1 !important;
    border-color: #1e293b !important;
  }
  .swagger-ui .parameter__name, .swagger-ui .parameter__type {
    color: #cbd5e1 !important;
  }
  .swagger-ui .response-col_status {
    color: #38bdf8 !important;
  }
`;

const swaggerCustomOptions = {
  customCss,
  customSiteTitle: 'NodeFlow Enterprise API Explorer',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
    docExpansion: 'list',
    defaultModelsExpandDepth: 1
  }
};

module.exports = {
  swaggerUi,
  swaggerSpec,
  swaggerCustomOptions,
  generateAutoSwaggerSpec
};
