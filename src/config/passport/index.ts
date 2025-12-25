import '../env/envConfig';
import { ExtractJwt, Strategy as JwtStrategy, StrategyOptions } from 'passport-jwt';
import passport from 'passport';
import { AdminUser } from '../../models';
import { JwtPayload } from '../../common/interfaces/jwtInterfaces';
import { getAdminUserWithRolesAndPermissions, formatAdminUserResponse } from '../../utils/adminUser.utils';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

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

        // Find admin user by ID with roles and permissions
        const adminUser = await getAdminUserWithRolesAndPermissions(jwtPayload.userId);
        
        if (!adminUser) {
          return done(null, false, { message: 'Admin user not found' });
        }

        // Check if admin user is active
        if (!adminUser.isActive) {
          return done(null, false, { message: 'Admin user account is inactive' });
        }

        // Format admin user response with roles and permissions
        const adminUserData = formatAdminUserResponse(adminUser);

        // Return admin user data with roles and permissions
        const userData = {
          userId: adminUserData.id,
          id: adminUserData.id,
          firstName: adminUserData.firstName,
          lastName: adminUserData.lastName,
          fullName: adminUserData.fullName,
          email: adminUserData.email,
          isActive: adminUserData.isActive,
          roles: adminUserData.roles,
          permissions: adminUserData.permissions,
        };

        return done(null, userData);
      } catch (error) {
        console.error('JWT Strategy error:', error);
        return done(error, false);
      }
    }),
  );
};