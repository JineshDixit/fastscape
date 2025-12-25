import { AdminUser, Role, Policy } from '../models';
import { AdminUserResponse } from '../common/interfaces/authTypes';

/**
 * Format admin user response with roles and permissions
 */
export const formatAdminUserResponse = (user: AdminUser): AdminUserResponse => {
  const roles = (user as any).Roles || [];
  const permissions = new Set<string>();

  // Collect all permissions from all roles
  roles.forEach((role: any) => {
    const policies = role.Policies || [];
    policies.forEach((policy: any) => {
      policy.permissions.forEach((permission: string) => {
        permissions.add(permission);
      });
    });
  });

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    email: user.email,
    isActive: user.isActive,
    roles: roles.map((role: any) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isActive: role.isActive,
    })),
    permissions: Array.from(permissions),
  };
};

/**
 * Get admin user with roles and permissions - centralized query
 */
export const getAdminUserWithRolesAndPermissions = async (adminUserId: number): Promise<AdminUser | null> => {
  return await AdminUser.findByPk(adminUserId, {
    include: [
      {
        model: Role,
        through: { attributes: [] },
        include: [
          {
            model: Policy,
            through: { attributes: [] },
            where: { isActive: true },
            required: false,
          }
        ],
        where: { isActive: true },
        required: false,
      }
    ],
  });
};