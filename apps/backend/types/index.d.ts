/**
 * Aero MVC Enterprise Framework Type Definitions
 * Provides full IntelliSense and type safety for global helpers, request/response, and models.
 */
import { Request, Response, NextFunction } from 'express';

declare global {
  // Global helpers and libraries
  var DB: typeof import('../config/db');
  var Cache: typeof import('../core/Cache');
  var Logger: typeof import('../core/Logger');
  var Flash: typeof import('../core/Flash');
  var Gate: typeof import('../core/Gate');
  var ApiResource: typeof import('../core/ApiResource');
  var Queue: typeof import('../core/Queue');
  var Throttle: typeof import('../core/Throttle');
  var Mailer: typeof import('../core/Mailer');
  var Sms: typeof import('../core/Sms');
  var Notification: typeof import('../core/Notification');

  var env: (key: string, defaultValue?: any) => any;
  var base_url: (path?: string) => string;
  var url: (path?: string) => string;
  var asset: (path?: string) => string;
  var viteAsset: (path?: string) => string;
  var isViteDevActive: () => boolean;
  var dd: (...vars: any[]) => void;
  var flash: (name?: string, message?: string, className?: string) => string | void;

  var sendMail: (to: string | string[], subject: string, html?: string, text?: string) => Promise<MailResult>;
  var sendSms: (to: string, message: string, provider?: 'twilio' | 'webhook' | 'mock') => Promise<SmsResult>;
  var notify: (notifiable: any, notification: BaseNotification) => Promise<Record<string, any>>;

  namespace Express {
    interface Request {
      user?: any;
      token?: PersonalAccessToken;
      tokenAbilities?: string[];
      flash?: (type?: string, msg?: string) => any;
    }
    interface Response {
      success?: (data?: any, message?: string, code?: number) => Response;
      error?: (message?: string, code?: number, errors?: any) => Response;
      paginate?: (data: any[], total: number, page: number, perPage: number) => Response;
    }
  }
}

export interface UserRecord {
  id?: number;
  user_id?: number;
  username: string;
  email?: string;
  full_name?: string;
  role: string;
  is_active: number | string;
  password?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PersonalAccessToken {
  id: number;
  tokenable_type: string;
  tokenable_id: number;
  name: string;
  token: string;
  abilities?: string;
  expires_at?: string | null;
  last_used_at?: string | null;
  created_at: string;
  updated_at?: string;
  is_expired?: boolean;
}

export interface TokenCreationResult {
  plainTextToken: string;
  token: string;
  expires_at: string | null;
  created_at: string;
  abilities: string[];
}

export interface ThrottleOptions {
  max?: number;
  windowMs?: number;
  message?: string | object | ((req: Request, res: Response) => any);
  statusCode?: number;
  headers?: boolean;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
}

export interface MailAttachment {
  filename?: string;
  content?: string | Buffer;
  path?: string;
  contentType?: string;
}

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  attachments?: MailAttachment[];
}

export interface MailResult {
  success: boolean;
  messageId?: string;
  accepted?: string[];
  rejected?: string[];
  sandbox?: boolean;
  error?: string;
}

export interface SendSmsOptions {
  to: string;
  message: string;
  from?: string;
  provider?: 'twilio' | 'webhook' | 'mock';
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  sandbox?: boolean;
  provider?: string;
  error?: string;
}

export type NotificationChannel = 'mail' | 'sms' | 'database';

export interface BaseNotification {
  via(notifiable: any): NotificationChannel[];
  toMail?(notifiable: any): SendMailOptions;
  toSms?(notifiable: any): SendSmsOptions;
  toArray?(notifiable: any): Record<string, any>;
  queued?: boolean;
}
