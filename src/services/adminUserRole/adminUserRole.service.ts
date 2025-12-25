import { AdminUserRole, AdminUser, Role } from '../../models';
import { AssignRoleRequest, AdminUserResponse, RoleResponse } from '../../common/interfaces/authTypes';
import { formatAdminUserResponse, getAdminUserWithRolesAndPermissions } from '../../utils/adminUser.utils';
import { createError } from '../middleware/errorHandler';
import { validateRequiredFields } from '../../utils/validation.utils';

/**
 * Assign role to admin user
 */
export const assignRole = async (
  assignData: AssignRoleRequest,
  assignedBy?: number
): Promise<AdminUserResponse> => {
  const { adminUserId, roleId } = assignData;

  // Validate required fields
  validateRequiredFields(assignData, ['adminUserId', 'roleId']);

  // Check if admin user exists and is active
  const adminUser = await AdminUser.findOne({ 
    where: { id: adminUserId, isActive: true } 
  });
  if (!adminUser) {
    throw createError('Admin user not found or inactive', 404);
  }

  // Check if role exists and is active
  const role = await Role.findOne({ 
    where: { id: roleId, isActive: true } 
  });
  if (!role) {
    throw createError('Role not found or inactive', 404);
  }

  // Check if assignment already exists
  const existingAssignment = await AdminUserRole.findOne({
    where: { adminUserId, roleId }
  });

  if (existingAssignment) {
    throw createError('Role is already assigned to this admin user', 409);
  }

  // Create assignment
  await AdminUserRole.create({
    adminUserId,
    roleId,
    assignedBy,
  });

  // Get updated admin user with roles
  const updatedUser = await getAdminUserWithRolesAndPermissions(adminUserId);
  return formatAdminUserResponse(updatedUser!);
};

/**
 * Remove role from admin user
 */
export const removeRole = async (
  adminUserId: number,
  roleId: number
): Promise<AdminUserResponse> => {
  // Check if assignment exists
  const assignment = await AdminUserRole.findOne({
    where: { adminUserId, roleId }
  });

  if (!assignment) {
    throw createError('Role is not assigned to this admin user', 404);
  }

  // Remove assignment
  await assignment.destroy();

  // Get updated admin user with roles
  const updatedUser = await getAdminUserWithRolesAndPermissions(adminUserId);

  if (!updatedUser) {
    throw createError('Admin user not found', 404);
  }

  return formatAdminUserResponse(updatedUser);
};

/**
 * Get all roles assigned to an admin user
 */
export const getUserRoles = async (adminUserId: number): Promise<RoleResponse[]> => {
  const adminUser = await AdminUser.findByPk(adminUserId, {
    include: [
      {
        model: Role,
        through: { attributes: [] },
        where: { isActive: true },
        required: false,
      }
    ],
  });

  if (!adminUser) {
    throw createError('Admin user not found', 404);
  }

  const roles = (adminUser as any).Roles || [];
  
  return roles.map((role: any) => ({
    id: role.id,
    name: role.name,
    description: role.description,
    isActive: role.isActive,
  }));
};

/**
 * Get all admin users assigned to a role
 */
export const getRoleUsers = async (roleId: number): Promise<AdminUserResponse[]> => {
  const role = await Role.findByPk(roleId, {
    include: [
      {
        model: AdminUser,
        through: { attributes: [] },
        where: { isActive: true },
        required: false,
      }
    ],
  });

  if (!role) {
    throw createError('Role not found', 404);
  }

  const adminUsers = (role as any).AdminUsers || [];
  
  return adminUsers.map((user: any) => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    email: user.email,
    isActive: user.isActive,
  }));
};

/**
 * Get admin user permissions (from all assigned roles)
 */
export const getUserPermissions = async (adminUserId: number): Promise<string[]> => {
  const adminUser = await getAdminUserWithRolesAndPermissions(adminUserId);

  if (!adminUser) {
    throw createError('Admin user not found', 404);
  }

  const userResponse = formatAdminUserResponse(adminUser);
  return userResponse.permissions || [];
};

/**
 * Check if admin user has specific role
 */
export const hasRole = async (adminUserId: number, roleId: number): Promise<boolean> => {
  const assignment = await AdminUserRole.findOne({
    where: { adminUserId, roleId }
  });

  return !!assignment;
};

/**
 * Check if admin user has any of the specified roles
 */
export const hasAnyRole = async (adminUserId: number, roleIds: number[]): Promise<boolean> => {
  const assignments = await AdminUserRole.findAll({
    where: { 
      adminUserId,
      roleId: roleIds
    }
  });

  return assignments.length > 0;
};

/**
 * Check if admin user has specific permission
 */
export const hasPermission = async (adminUserId: number, permission: string): Promise<boolean> => {
  const permissions = await getUserPermissions(adminUserId);
  return permissions.includes(permission);
};

/**
 * Check if admin user has any of the specified permissions
 */
export const hasAnyPermission = async (adminUserId: number, permissions: string[]): Promise<boolean> => {
  const userPermissions = await getUserPermissions(adminUserId);
  return permissions.some(permission => userPermissions.includes(permission));
};

/**
 * Bulk assign roles to admin user
 */
export const bulkAssignRoles = async (
  adminUserId: number,
  roleIds: number[],
  assignedBy?: number
): Promise<AdminUserResponse> => {
  // Check if admin user exists and is active
  const adminUser = await AdminUser.findOne({ 
    where: { id: adminUserId, isActive: true } 
  });
  if (!adminUser) {
    throw createError('Admin user not found or inactive', 404);
  }

  // Check if all roles exist and are active
  const roles = await Role.findAll({
    where: { id: roleIds, isActive: true }
  });

  if (roles.length !== roleIds.length) {
    throw createError('One or more roles not found or inactive', 404);
  }

  // Get existing assignments
  const existingAssignments = await AdminUserRole.findAll({
    where: { adminUserId, roleId: roleIds }
  });

  const existingRoleIds = existingAssignments.map(assignment => assignment.roleId);
  const newRoleIds = roleIds.filter(roleId => !existingRoleIds.includes(roleId));

  // Create new assignments
  if (newRoleIds.length > 0) {
    const assignmentData = newRoleIds.map(roleId => ({
      adminUserId,
      roleId,
      assignedBy,
    }));

    await AdminUserRole.bulkCreate(assignmentData);
  }

  // Get updated admin user with roles
  const updatedUser = await getAdminUserWithRolesAndPermissions(adminUserId);
  return formatAdminUserResponse(updatedUser!);
};

/**
 * Remove all roles from admin user
 */
export const removeAllRoles = async (adminUserId: number): Promise<AdminUserResponse> => {
  // Remove all assignments
  await AdminUserRole.destroy({
    where: { adminUserId }
  });

  // Get updated admin user
  const updatedUser = await AdminUser.findByPk(adminUserId);

  if (!updatedUser) {
    throw createError('Admin user not found', 404);
  }

  return {
    id: updatedUser.id,
    firstName: updatedUser.firstName,
    lastName: updatedUser.lastName,
    fullName: updatedUser.fullName,
    email: updatedUser.email,
    isActive: updatedUser.isActive,
    roles: [],
    permissions: [],
  };
};