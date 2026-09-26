"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPermission = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
/**
 * Middleware to check if user has required permissions
 */
const checkPermission = (requiredPermissions) => {
    return (req, res, next) => {
        try {
            // Get user from request (set by authenticateUser middleware)
            const user = req.user;
            if (!user) {
                throw (0, errorHandler_1.createError)('Authentication required', 401);
            }
            // For now, we'll implement a basic permission check
            // In a full implementation, this would check against user roles and permissions
            // For the admin panel, we can assume authenticated admin users have all permissions
            // TODO: Implement proper permission checking based on user roles and policies
            // This would involve:
            // 1. Getting user's roles from database
            // 2. Getting permissions from roles' policies
            // 3. Checking if any of the required permissions are present
            // For now, allow all authenticated admin users
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.checkPermission = checkPermission;
//# sourceMappingURL=checkPermission.js.map