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
const models_1 = require("../../models");
const { JWT_ACCESS_SECRET } = process.env;
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
            // Find user by ID
            const user = yield models_1.User.findByPk(jwtPayload.userId);
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
        }
        catch (error) {
            console.error('JWT Strategy error:', error);
            return done(error, false);
        }
    })));
};
exports.configPassport = configPassport;
//# sourceMappingURL=index.js.map