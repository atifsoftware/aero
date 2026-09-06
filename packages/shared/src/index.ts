/**
 * NodeFlow Shared Contracts, Constants & Types
 * Single source of truth across Backend, Web (Next.js), and Mobile (React Native Expo).
 */

export const API_ENDPOINTS = {
  STATUS: '/api/status',
  SETTINGS: '/api/settings',
  AUTH: {
    LOGIN: '/api/login',
    USER: '/api/user',
    CHANGE_PASSWORD: '/api/user/change-password',
  },
  DASHBOARD: {
    SUMMARY: '/api/dashboard/summary',
    FRAMEWORK_STATS: '/api/dashboard/framework-stats',
    SHOP_SUMMARY: '/api/dashboard/shop-summary',
  },
  VOUCHERS: {
    CATEGORIES: '/api/categories',
    ACCOUNTS: '/api/accounts',
    EXPENSES: '/api/expenses',
    INCOMES: '/api/incomes',
    TEMPLATES: '/api/expense-templates',
  },
  PARTIES: {
    CUSTOMERS: '/api/customers',
    SUPPLIERS: '/api/suppliers',
  },
  DAILY_SHEET: {
    LIST: '/api/daily-sheets',
    EXTERNAL: '/api/daily-sheets/external-data',
  },
  HR: {
    EMPLOYEES: '/api/employees',
    SALARIES: '/api/salaries',
    ATTENDANCE: '/api/attendance',
  },
  AI: {
    ASK: '/api/ai/ask',
    SUMMARIZE: '/api/ai/summarize',
  },
  REPORTS: {
    LEDGER: '/api/reports/ledger',
    DAILY_CASHBOOK: '/api/reports/daily-cashbook',
    EXPENSE: '/api/reports/expense',
    INCOME: '/api/reports/income',
  }
} as const;

export const APP_CONFIG = {
  DEFAULT_BACKEND_PORT: 3001,
  DEFAULT_WEB_PORT: 3000,
  DEFAULT_MOBILE_PORT: 8081,
  DEFAULT_PAGE_SIZE: 15,
  APP_NAME: 'NodeFlow Framework',
} as const;

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  data?: T;
  pagination?: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    has_more: boolean;
  };
  errors?: Record<string, string[]>;
  meta?: {
    timestamp: string;
    execution_time_ms?: number;
  };
}

export interface UserProfile {
  id: number;
  name: string;
  email?: string;
  username?: string;
  role: 'admin' | 'manager' | 'staff' | string;
  permissions?: string[];
}

export interface VoucherItem {
  voucher_id?: number;
  voucher_no?: string;
  category_id: number;
  category_name?: string;
  account_id: number;
  account_name?: string;
  amount: number;
  type: 'expense' | 'income';
  note?: string;
  date?: string;
  created_at?: string;
}

export interface SystemStats {
  usersCount: number;
  logsCount: number;
  tokensCount: number;
  osType: string;
  memoryUsage: string;
  uptime: string;
  nodeVersion: string;
}
