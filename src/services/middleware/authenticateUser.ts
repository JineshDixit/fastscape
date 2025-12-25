import { RequestHandler } from 'express';
import passport from 'passport';

/**
 * Middleware to authenticate user
 */
export const authenticateUser: RequestHandler = passport.authenticate('jwt', {
  session: false,
});
