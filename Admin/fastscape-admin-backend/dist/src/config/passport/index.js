"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configPassport = void 0;
require("../env/envConfig");
const passport_jwt_1 = require("passport-jwt");
const passport_1 = __importDefault(require("passport"));
const adminUser_utils_1 = require("../../utils/adminUser.utils");
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const options = {
    jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: JWT_ACCESS_SECRET,
};
/**
 * Configure passport to use JWT strategy for access tokens
 */
const configPassport = () => {
    passport_1.default.use(new passport_jwt_1.Strategy(options, (jwtPayload, done) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Verify this is an access token
            if (jwtPayload.type !== 'access') {
                return done(null, false, { message: 'Invalid token type' });
            }
            // Find admin user by ID with roles and permissions
            const adminUser = yield (0, adminUser_utils_1.getAdminUserWithRolesAndPermissions)(jwtPayload.userId);
            if (!adminUser) {
                return done(null, false, { message: 'Admin user not found' });
            }
            // Check if admin user is active
            if (!adminUser.isActive) {
                return done(null, false, { message: 'Admin user account is inactive' });
            }
            // Format admin user response with roles and permissions
            const adminUserData = (0, adminUser_utils_1.formatAdminUserResponse)(adminUser);
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
        }
        catch (error) {
            console.error('JWT Strategy error:', error);
            return done(error, false);
        }
    })));
};
exports.configPassport = configPassport;
//# sourceMappingURL=index.js.map