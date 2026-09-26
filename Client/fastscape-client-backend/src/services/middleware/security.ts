import { Request, Response, NextFunction } from 'express';

/**
 * Sanitize request body to prevent XSS
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  if (req.body) {
    // Recursively sanitize all string values in the request body
    // Limit recursion depth to 5 to prevent stack overflow
    req.body = sanitizeObject(req.body, 0, 5);
  }
  next();
};

/**
 * Recursively sanitize an object
 */
const sanitizeObject = (obj: any, depth: number, maxDepth: number): any => {
  if (depth > maxDepth) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, depth + 1, maxDepth));
  }

  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeObject(obj[key], depth + 1, maxDepth);
      }
    }
    return sanitized;
  }

  return obj;
};

/**
 * Sanitize a string to prevent XSS
 * Uses a single replace with a map for better performance
 */
const sanitizeString = (str: string): string => {
  const map: Record<string, string> = {
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return str.replace(/[<>"'/]/g, (match) => map[match]);
};

/**
 * Prevent parameter pollution
 */
export const preventParameterPollution = (req: Request, res: Response, next: NextFunction): void => {
  // Convert array parameters to single values (take the last one)
  // EXCEPT for specific filters that support multiple values
  const allowArrays = ['make', 'model', 'bodyType'];

  if (req.query) {
    for (const key in req.query) {
      if (Array.isArray(req.query[key]) && !allowArrays.includes(key)) {
        req.query[key] = (req.query[key] as string[]).pop();
      }
    }
  }
  next();
};
