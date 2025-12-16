import { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  nationality: string;
  isBlocked: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}