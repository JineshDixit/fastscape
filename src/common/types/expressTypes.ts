import { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality: string;
  isBlocked: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}
