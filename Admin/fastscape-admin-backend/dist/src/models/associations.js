"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defineAssociations = void 0;
const AdminUser_1 = __importDefault(require("./AdminUser"));
const Role_1 = __importDefault(require("./Role"));
const Policy_1 = __importDefault(require("./Policy"));
const RolePolicy_1 = __importDefault(require("./RolePolicy"));
const AdminUserRole_1 = __importDefault(require("./AdminUserRole"));
const AdminRefreshToken_1 = __importDefault(require("./AdminRefreshToken"));
// Define associations
const defineAssociations = () => {
    // AdminUser and Role many-to-many relationship through AdminUserRole
    AdminUser_1.default.belongsToMany(Role_1.default, {
        through: AdminUserRole_1.default,
        foreignKey: 'adminUserId',
        otherKey: 'roleId',
        as: 'roles',
    });
    Role_1.default.belongsToMany(AdminUser_1.default, {
        through: AdminUserRole_1.default,
        foreignKey: 'roleId',
        otherKey: 'adminUserId',
        as: 'adminUsers',
    });
    // Role and Policy many-to-many relationship through RolePolicy
    Role_1.default.belongsToMany(Policy_1.default, {
        through: RolePolicy_1.default,
        foreignKey: 'roleId',
        otherKey: 'policyId',
        as: 'policies',
    });
    Policy_1.default.belongsToMany(Role_1.default, {
        through: RolePolicy_1.default,
        foreignKey: 'policyId',
        otherKey: 'roleId',
        as: 'roles',
    });
    // AdminUser and AdminRefreshToken one-to-many relationship
    AdminUser_1.default.hasMany(AdminRefreshToken_1.default, {
        foreignKey: 'adminUserId',
        as: 'refreshTokens',
    });
    AdminRefreshToken_1.default.belongsTo(AdminUser_1.default, {
        foreignKey: 'adminUserId',
        as: 'adminUser',
    });
    // AdminUserRole associations
    AdminUserRole_1.default.belongsTo(AdminUser_1.default, {
        foreignKey: 'adminUserId',
        as: 'adminUser',
    });
    AdminUserRole_1.default.belongsTo(Role_1.default, {
        foreignKey: 'roleId',
        as: 'role',
    });
    AdminUserRole_1.default.belongsTo(AdminUser_1.default, {
        foreignKey: 'assignedBy',
        as: 'assignedByUser',
    });
    // RolePolicy associations
    RolePolicy_1.default.belongsTo(Role_1.default, {
        foreignKey: 'roleId',
        as: 'role',
    });
    RolePolicy_1.default.belongsTo(Policy_1.default, {
        foreignKey: 'policyId',
        as: 'policy',
    });
    // Direct associations for easier querying
    AdminUser_1.default.hasMany(AdminUserRole_1.default, {
        foreignKey: 'adminUserId',
        as: 'userRoles',
    });
    Role_1.default.hasMany(AdminUserRole_1.default, {
        foreignKey: 'roleId',
        as: 'userRoles',
    });
    Role_1.default.hasMany(RolePolicy_1.default, {
        foreignKey: 'roleId',
        as: 'rolePolicies',
    });
    Policy_1.default.hasMany(RolePolicy_1.default, {
        foreignKey: 'policyId',
        as: 'rolePolicies',
    });
};
exports.defineAssociations = defineAssociations;
//# sourceMappingURL=associations.js.map