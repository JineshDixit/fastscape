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
exports.runAdminSeeder = exports.seedAdminUsersData = exports.seedRolePolicyMappings = exports.seedRolesData = exports.seedPoliciesData = void 0;
require("../config/env/envConfig");
const models_1 = require("../models");
const password_utils_1 = require("../utils/password.utils");
/**
 * Seed data for policies (permissions)
 */
const seedPolicies = [
    {
        name: 'super-admin-policy',
        description: 'Full system access with all permissions',
        permissions: [
            // Admin User Management
            'admin.users.create',
            'admin.users.read',
            'admin.users.update',
            'admin.users.delete',
            'admin.users.activate',
            'admin.users.deactivate',
            'admin.users.manage',
            // Role Management
            'admin.roles.create',
            'admin.roles.read',
            'admin.roles.update',
            'admin.roles.delete',
            'admin.roles.activate',
            'admin.roles.deactivate',
            'admin.roles.manage',
            // Policy Management
            'admin.policies.create',
            'admin.policies.read',
            'admin.policies.update',
            'admin.policies.delete',
            'admin.policies.activate',
            'admin.policies.deactivate',
            'admin.policies.manage',
            // System Management
            'admin.system.settings',
            'admin.system.logs',
            'admin.system.maintenance',
            'admin.system.backup',
            // Analytics & Reports
            'admin.analytics.read',
            'admin.reports.generate',
            'admin.reports.export',
            // Content Management (for future use)
            'admin.content.create',
            'admin.content.read',
            'admin.content.update',
            'admin.content.delete',
            'admin.content.moderate',
        ],
        isActive: true,
    },
    {
        name: 'admin-policy',
        description: 'Standard admin permissions for user and content management',
        permissions: [
            // Limited Admin User Management
            'admin.users.read',
            'admin.users.update',
            'admin.users.deactivate',
            // Limited Role Management
            'admin.roles.read',
            // Limited Policy Management
            'admin.policies.read',
            // Content Management
            'admin.content.create',
            'admin.content.read',
            'admin.content.update',
            'admin.content.delete',
            'admin.content.moderate',
            // Analytics & Reports (Read Only)
            'admin.analytics.read',
            'admin.reports.generate',
        ],
        isActive: true,
    },
    {
        name: 'moderator-policy',
        description: 'Content moderation and basic user management',
        permissions: [
            // Basic User Management
            'admin.users.read',
            'admin.users.deactivate',
            // Content Management
            'admin.content.read',
            'admin.content.update',
            'admin.content.moderate',
            'admin.content.delete',
            // Basic Analytics
            'admin.analytics.read',
        ],
        isActive: true,
    },
    {
        name: 'support-policy',
        description: 'Customer support and read-only access',
        permissions: [
            // Read-only User Access
            'admin.users.read',
            // Read-only Content Access
            'admin.content.read',
            // Basic Analytics
            'admin.analytics.read',
            // Support specific permissions
            'admin.support.tickets.read',
            'admin.support.tickets.update',
            'admin.support.tickets.respond',
        ],
        isActive: true,
    },
];
/**
 * Seed data for roles
 */
const seedRoles = [
    {
        name: 'super-admin',
        description: 'Super Administrator with full system access',
        isActive: true,
    },
    {
        name: 'admin',
        description: 'Administrator with standard admin permissions',
        isActive: true,
    },
    {
        name: 'moderator',
        description: 'Content moderator with limited admin access',
        isActive: true,
    },
    {
        name: 'support',
        description: 'Support agent with read-only access',
        isActive: true,
    },
];
/**
 * Seed data for admin users
 */
const seedAdminUsers = [
    {
        firstName: 'Super',
        lastName: 'Admin',
        email: 'superadmin@gmail.com',
        password: 'SuperAdmin123!',
        isActive: true,
        roles: ['super-admin'],
    },
    {
        firstName: 'John',
        lastName: 'Admin',
        email: 'admin@gmail.com',
        password: 'Admin123!',
        isActive: true,
        roles: ['admin'],
    },
    {
        firstName: 'Jane',
        lastName: 'Moderator',
        email: 'moderator@gmail.com',
        password: 'Moderator123!',
        isActive: true,
        roles: ['moderator'],
    },
    {
        firstName: 'Mike',
        lastName: 'Support',
        email: 'support@gmail.com',
        password: 'Support123!',
        isActive: true,
        roles: ['support'],
    },
];
/**
 * Role-Policy mappings
 */
const rolePolicyMappings = [
    { roleName: 'super-admin', policyName: 'super-admin-policy' },
    { roleName: 'admin', policyName: 'admin-policy' },
    { roleName: 'moderator', policyName: 'moderator-policy' },
    { roleName: 'support', policyName: 'support-policy' },
];
/**
 * Seed policies
 */
const seedPoliciesData = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('🌱 Seeding policies...');
    for (const policyData of seedPolicies) {
        const existingPolicy = yield models_1.Policy.findOne({ where: { name: policyData.name } });
        if (!existingPolicy) {
            yield models_1.Policy.create(policyData);
            console.log(`✅ Created policy: ${policyData.name}`);
        }
        else {
            // Update existing policy with new permissions
            yield existingPolicy.update({
                permissions: policyData.permissions,
                description: policyData.description,
            });
            console.log(`🔄 Updated policy: ${policyData.name}`);
        }
    }
    console.log('✅ Policies seeded successfully');
});
exports.seedPoliciesData = seedPoliciesData;
/**
 * Seed roles
 */
const seedRolesData = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('🌱 Seeding roles...');
    for (const roleData of seedRoles) {
        const existingRole = yield models_1.Role.findOne({ where: { name: roleData.name } });
        if (!existingRole) {
            yield models_1.Role.create(roleData);
            console.log(`✅ Created role: ${roleData.name}`);
        }
        else {
            yield existingRole.update({
                description: roleData.description,
                isActive: roleData.isActive,
            });
            console.log(`🔄 Updated role: ${roleData.name}`);
        }
    }
    console.log('✅ Roles seeded successfully');
});
exports.seedRolesData = seedRolesData;
/**
 * Seed role-policy mappings
 */
const seedRolePolicyMappings = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('🌱 Seeding role-policy mappings...');
    for (const mapping of rolePolicyMappings) {
        const role = yield models_1.Role.findOne({ where: { name: mapping.roleName } });
        const policy = yield models_1.Policy.findOne({ where: { name: mapping.policyName } });
        if (role && policy) {
            const existingMapping = yield models_1.RolePolicy.findOne({
                where: { roleId: role.id, policyId: policy.id }
            });
            if (!existingMapping) {
                yield models_1.RolePolicy.create({
                    roleId: role.id,
                    policyId: policy.id,
                });
                console.log(`✅ Mapped role "${mapping.roleName}" to policy "${mapping.policyName}"`);
            }
            else {
                console.log(`⚠️  Mapping already exists: ${mapping.roleName} -> ${mapping.policyName}`);
            }
        }
        else {
            console.log(`❌ Failed to map: ${mapping.roleName} -> ${mapping.policyName} (role or policy not found)`);
        }
    }
    console.log('✅ Role-policy mappings seeded successfully');
});
exports.seedRolePolicyMappings = seedRolePolicyMappings;
/**
 * Seed admin users
 */
const seedAdminUsersData = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('🌱 Seeding admin users...');
    for (const userData of seedAdminUsers) {
        const existingUser = yield models_1.AdminUser.findOne({ where: { email: userData.email } });
        if (!existingUser) {
            // Hash password
            const passwordHash = yield (0, password_utils_1.hashPassword)(userData.password);
            // Create user
            const user = yield models_1.AdminUser.create({
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                passwordHash,
                isActive: userData.isActive,
            });
            // Assign roles
            for (const roleName of userData.roles) {
                const role = yield models_1.Role.findOne({ where: { name: roleName } });
                if (role) {
                    yield models_1.AdminUserRole.create({
                        adminUserId: user.id,
                        roleId: role.id,
                        // assignedBy is nullable, so we can omit it for system seeding
                    });
                    console.log(`✅ Assigned role "${roleName}" to user "${userData.email}"`);
                }
            }
            console.log(`✅ Created admin user: ${userData.email} (Password: ${userData.password})`);
        }
        else {
            console.log(`⚠️  Admin user already exists: ${userData.email}`);
        }
    }
    console.log('✅ Admin users seeded successfully');
});
exports.seedAdminUsersData = seedAdminUsersData;
/**
 * Main seeder function
 */
const runAdminSeeder = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('🚀 Starting admin seeder...');
        // Seed in correct order due to dependencies
        yield (0, exports.seedPoliciesData)();
        yield (0, exports.seedRolesData)();
        yield (0, exports.seedRolePolicyMappings)();
        yield (0, exports.seedAdminUsersData)();
        console.log('🎉 Admin seeder completed successfully!');
        console.log('\n📋 Created Admin Users:');
        console.log('┌─────────────────────────────────────────────────────────────┐');
        console.log('│ Email                    │ Password        │ Role           │');
        console.log('├─────────────────────────────────────────────────────────────┤');
        console.log('│ superadmin@gmail.com     │ SuperAdmin123!  │ super-admin    │');
        console.log('│ admin@gmail.com          │ Admin123!       │ admin          │');
        console.log('│ moderator@gmail.com      │ Moderator123!   │ moderator      │');
        console.log('│ support@gmail.com        │ Support123!     │ support        │');
        console.log('└─────────────────────────────────────────────────────────────┘');
        console.log('\n🔐 Use these credentials to test the admin authentication system.');
    }
    catch (error) {
        console.error('❌ Admin seeder failed:', error);
        throw error;
    }
});
exports.runAdminSeeder = runAdminSeeder;
/**
 * Main execution function
 */
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('🔧 Initializing database connection...');
        // Initialize database
        (0, models_1.initPostgres_DB)();
        // Wait a moment for database to initialize
        yield new Promise(resolve => setTimeout(resolve, 2000));
        console.log('✅ Database connection established');
        // Run admin seeder
        yield (0, exports.runAdminSeeder)();
        console.log('\n🎉 Seeder completed successfully!');
        console.log('🔚 Exiting...');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Seeder failed:', error);
        process.exit(1);
    }
});
// Run seeder if this file is executed directly
if (require.main === module) {
    main();
}
//# sourceMappingURL=adminSeeder.js.map