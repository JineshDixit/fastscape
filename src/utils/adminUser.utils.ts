import { AdminUser } from '../models';
import { AdminUserResponse } from '../common/interfaces/authTypes';
import { AdminUserWithAssociations } from '../common/interfaces/userType';
import { ADMIN_USER_ROLES_POLICIES_INCLUDE } from '../common/constants/constants';

/**
 * Format admin user response with roles and permissions.
 * Industrial standard: Explicit type mapping and defensive coding for associations.
 */
export const formatAdminUserResponse = (user: AdminUser | AdminUserWithAssociations): AdminUserResponse => {
  const adminUser = user as AdminUserWithAssociations;
  const roles = adminUser.Roles || [];
  const permissions = new Set<string>();

  // Collect all permissions from all roles
  roles.forEach((role) => {
    const policies = role.Policies || [];
    policies.forEach((policy) => {
      if (Array.isArray(policy.permissions)) {
        policy.permissions.forEach((permission: string) => {
          permissions.add(permission);
        });
      }
    });
  });

  return {
    id: adminUser.id,
    firstName: adminUser.firstName,
    lastName: adminUser.lastName,
    fullName: adminUser.fullName,
    email: adminUser.email,
    isActive: adminUser.isActive,
    roles: roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isActive: role.isActive,
    })),
    permissions: Array.from(permissions),
  };
};

/**
 * Get admin user with roles and permissions - centralized query.
 * Industrial standard: encapsulate complex queries in helper functions.
 */
export const getAdminUserWithRolesAndPermissions = async (
  adminUserId: string,
): Promise<AdminUserWithAssociations | null> => {
  const user = await AdminUser.findByPk(adminUserId, {
    include: ADMIN_USER_ROLES_POLICIES_INCLUDE,
  });

  return user as AdminUserWithAssociations | null;
};
