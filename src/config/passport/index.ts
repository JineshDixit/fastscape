import '../env/envConfig';
import { ExtractJwt, Strategy as JwtStrategy, StrategyOptions } from 'passport-jwt';
import passport from 'passport';
import { User } from '../../models';
import { JwtPayload } from '../../common/types/jwtTypes';

const {JWT_ACCESS_SECRET} = process.env;

const options: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: JWT_ACCESS_SECRET,
};

/**
 * Configure passport to use JWT strategy for access tokens
 */
export const configPassport = (): void => {
  passport.use(
    new JwtStrategy(options, async (jwtPayload: JwtPayload, done) => {
      try {
        // Verify this is an access token
        if (jwtPayload.type !== 'access') {
          return done(null, false, { message: 'Invalid token type' });
        }

        // Find user by ID
        const user = await User.findByPk(jwtPayload.userId);

        if (!user) {
          return done(null, false, { message: 'User not found' });
        }

        // Check if user is blocked
        if (user.isBlocked) {
          return done(null, false, { message: 'User account is blocked' });
        }

        // Return user data (excluding sensitive information)
        const userData = {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          nationality: user.nationality,
          isBlocked: user.isBlocked,
        };

        return done(null, userData);
      } catch (error) {
        console.error('JWT Strategy error:', error);
        return done(error, false);
      }
    }),
  );
};
