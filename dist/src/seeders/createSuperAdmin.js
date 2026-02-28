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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSuperAdmin = createSuperAdmin;
require("../config/env/envConfig");
const models_1 = require("../models");
const password_utils_1 = require("../utils/password.utils");
const models_2 = require("../models");
const logger_utils_1 = require("../utils/logger.utils");
/**
 * Super Admin Seeder
 * Creates a super admin user with full system permissions
 */
const SUPER_ADMIN_DATA = {
    firstName: 'Super',
    lastName: 'Admin',
    email: 'superadmin@fastscape.com',
    password: 'SuperAdmin@2024!',
};
const SUPER_ADMIN_PERMISSIONS = [
    // User Management
    'users.view',
    'users.create',
    'users.edit',
    'users.delete',
    'users.manage',
    // Role Management
    'roles.view',
    'roles.create',
    'roles.edit',
    'roles.delete',
    'roles.manage',
    // Policy Management
    'policies.view',
    'policies.create',
    'policies.edit',
    'policies.delete',
    'policies.manage',
    // Admin Operations
    'admin',
    'admin.full_access',
    'admin.super_user',
];
function createSuperAdminPolicy() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Check if super admin policy already exists
            let policy = yield models_1.Policy.findOne({ where: { name: 'SuperAdminPolicy' } });
            if (policy) {
                logger_utils_1.dbLogger.info('Super Admin Policy already exists', {
                    policyId: policy.id,
                    permissionCount: policy.permissions.length,
                });
                return policy;
            }
            // Create super admin policy
            policy = yield models_1.Policy.create({
                name: 'SuperAdminPolicy',
                description: 'Full system access policy for super administrators',
                permissions: SUPER_ADMIN_PERMISSIONS,
                isActive: true,
            });
            logger_utils_1.dbLogger.info('Super Admin Policy created successfully', {
                policyId: policy.id,
                permissionCount: policy.permissions.length,
                permissions: policy.permissions,
            });
            return policy;
        }
        catch (error) {
            logger_utils_1.dbLogger.error('Failed to create Super Admin Policy', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    });
}
function createSuperAdminRole(policyId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            // Check if super admin role already exists
            let role = yield models_1.Role.findOne({
                where: { name: 'SuperAdmin' },
                include: [{ model: models_1.Policy, as: 'policies' }]
            });
            if (role) {
                // Ensure the role has the super admin policy
                const hasPolicy = yield role.hasPolicies([policyId]);
                if (!hasPolicy) {
                    yield role.addPolicies([policyId]);
                    logger_utils_1.dbLogger.info('Added Super Admin Policy to existing role', {
                        roleId: role.id,
                        policyId,
                    });
                }
                logger_utils_1.dbLogger.info('Super Admin Role already exists', {
                    roleId: role.id,
                    policyCount: ((_a = role.policies) === null || _a === void 0 ? void 0 : _a.length) || 0,
                });
                return role;
            }
            // Create super admin role
            role = yield models_1.Role.create({
                name: 'SuperAdmin',
                description: 'Super Administrator with full system access',
                isActive: true,
            });
            // Associate with super admin policy
            yield role.addPolicies([policyId]);
            logger_utils_1.dbLogger.info('Super Admin Role created successfully', {
                roleId: role.id,
                policyId,
            });
            return role;
        }
        catch (error) {
            logger_utils_1.dbLogger.error('Failed to create Super Admin Role', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    });
}
function createSuperAdminUser(roleId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            // Check if super admin user already exists
            let user = yield models_1.AdminUser.findOne({
                where: { email: SUPER_ADMIN_DATA.email },
                include: [{ model: models_1.Role, as: 'roles' }]
            });
            if (user) {
                // Ensure the user has the super admin role
                const hasRole = yield user.hasRoles([roleId]);
                if (!hasRole) {
                    yield user.addRoles([roleId]);
                    logger_utils_1.authLogger.info('Added Super Admin Role to existing user', {
                        userId: user.id,
                        roleId,
                    });
                }
                // Ensure user is active
                if (!user.isActive) {
                    yield user.update({ isActive: true });
                    logger_utils_1.authLogger.info('Activated existing Super Admin user', {
                        userId: user.id,
                    });
                }
                logger_utils_1.authLogger.info('Super Admin User already exists', {
                    userId: user.id,
                    email: user.email,
                    roleCount: ((_a = user.roles) === null || _a === void 0 ? void 0 : _a.length) || 0,
                });
                return user;
            }
            // Hash password
            const passwordHash = yield (0, password_utils_1.hashPassword)(SUPER_ADMIN_DATA.password);
            // Create super admin user
            user = yield models_1.AdminUser.create({
                firstName: SUPER_ADMIN_DATA.firstName,
                lastName: SUPER_ADMIN_DATA.lastName,
                email: SUPER_ADMIN_DATA.email,
                passwordHash,
                isActive: true,
            });
            // Associate with super admin role
            yield user.addRoles([roleId]);
            logger_utils_1.authLogger.info('Super Admin User created successfully', {
                userId: user.id,
                email: user.email,
                roleId,
            });
            return user;
        }
        catch (error) {
            logger_utils_1.authLogger.error('Failed to create Super Admin User', {
                error: error instanceof Error ? error.message : 'Unknown error',
                email: SUPER_ADMIN_DATA.email,
            });
            throw error;
        }
    });
}
function createSuperAdmin() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Starting Super Admin creation process...');
            // Initialize database
            console.log('Initializing database connection...');
            (0, models_2.initPostgres_DB)();
            // Wait a moment for database to initialize
            yield new Promise(resolve => setTimeout(resolve, 2000));
            // Create super admin policy
            console.log('Creating Super Admin Policy...');
            const policy = yield createSuperAdminPolicy();
            // Create super admin role
            console.log('Creating Super Admin Role...');
            const role = yield createSuperAdminRole(policy.id);
            // Create super admin user
            console.log('Creating Super Admin User...');
            const user = yield createSuperAdminUser(role.id);
            console.log('\nSuper Admin created successfully!');
            console.log('\nSuper Admin Details:');
            console.log(`   Name: ${user.firstName} ${user.lastName}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Password: ${SUPER_ADMIN_DATA.password}`);
            console.log(`   User ID: ${user.id}`);
            console.log(`   Role: SuperAdmin (ID: ${role.id})`);
            console.log(`   Permissions: ${SUPER_ADMIN_PERMISSIONS.length} permissions`);
            console.log('\nLogin Credentials:');
            console.log(`   Email: ${user.email}`);
            console.log(`   Password: ${SUPER_ADMIN_DATA.password}`);
            console.log('\nIMPORTANT: Change the password after first login!');
            console.log('\nYou can now use these credentials to login to the admin panel.');
        }
        catch (error) {
            console.error('\nFailed to create Super Admin:', error);
            process.exit(1);
        }
    });
}
// Run the seeder if this file is executed directly
if (require.main === module) {
    createSuperAdmin()
        .then(() => {
        console.log('\nSuper Admin seeder completed successfully!');
        process.exit(0);
    })
        .catch((error) => {
        console.error('\nSuper Admin seeder failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=createSuperAdmin.js.map