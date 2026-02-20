import { Role, Policy, RolePolicy, AdminUser } from '../../models';
import { CreateRoleRequest, UpdateRoleRequest, RoleResponse, PolicyResponse } from '../../common/interfaces/authTypes';
import { formatRoleResponse, formatRoleWithPoliciesResponse, getRoleWithPolicies } from '../../utils/role.utils';
import { createError } from '../middleware/errorHandler';
import { validateRequiredFields } from '../../utils/validation.utils';
import { Op } from 'sequelize';

/**
 * Create new role
 */
export const create = async (roleData: CreateRoleRequest): Promise<RoleResponse> => {
  const { name, description, policyIds } = roleData;

  // Validate required fields
  validateRequiredFields(roleData, ['name']);

  // Check if role already exists
  const existingRole = await Role.findOne({ where: { name } });
  if (existingRole) {
    throw createError('Role with this name already exists', 409);
  }

  // Create role
  const role = await Role.create({
    name,
    description,
    isActive: true,
  });

  // Assign policies if provided
  if (policyIds && policyIds.length > 0) {
    // Validate that all policies exist
    const policies = await Policy.findAll({
      where: { id: { [Op.in]: policyIds }, isActive: true },
    });

    if (policies.length !== policyIds.length) {
      throw createError('One or more policies not found or inactive', 404);
    }

    // Create role-policy associations
    const rolePolicyData = policyIds.map((policyId) => ({
      roleId: role.id,
      policyId,
    }));

    await RolePolicy.bulkCreate(rolePolicyData);
  }

  return formatRoleResponse(role);
};

/**
 * Get role by ID
 */
export const getById = async (roleId: string): Promise<RoleResponse & { policies: PolicyResponse[] }> => {
  const role = await getRoleWithPolicies(roleId);

  if (!role) {
    throw createError('Role not found', 404);
  }

  return formatRoleWithPoliciesResponse(role);
};

/**
 * Get all roles with pagination
 */
export const getAll = async (
  page: number = 1,
  limit: number = 20,
  search?: string,
  isActive?: boolean,
  includePolicies: boolean = false,
): Promise<{ roles: RoleResponse[]; total: number; totalPages: number }> => {
  const offset = (page - 1) * limit;

  const whereClause: any = {};

  if (search) {
    whereClause[Op.or] = [{ name: { [Op.iLike]: `%${search}%` } }, { description: { [Op.iLike]: `%${search}%` } }];
  }

  if (isActive !== undefined) {
    whereClause.isActive = isActive;
  }

  const includeOptions = includePolicies
    ? [
        {
          model: Policy,
          through: { attributes: [] as string[] },
          where: { isActive: true },
          required: false,
        },
      ]
    : [];

  const { rows: roles, count: total } = await Role.findAndCountAll({
    where: whereClause,
    include: includeOptions,
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });

  return {
    roles: roles.map((role) => (includePolicies ? formatRoleWithPoliciesResponse(role) : formatRoleResponse(role))),
    total,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Update role
 */
export const update = async (roleId: string, updateData: UpdateRoleRequest): Promise<RoleResponse> => {
  const role = await Role.findByPk(roleId);

  if (!role) {
    throw createError('Role not found', 404);
  }

  // If name is being updated, check for duplicates
  if (updateData.name) {
    const existingRole = await Role.findOne({
      where: {
        name: updateData.name,
        id: { [Op.ne]: roleId },
      },
    });

    if (existingRole) {
      throw createError('Role with this name already exists', 409);
    }
  }

  // Update role
  await role.update(updateData);

  return formatRoleResponse(role);
};

/**
 * Delete role (soft delete by deactivating)
 */
export const remove = async (roleId: string): Promise<void> => {
  const role = await Role.findByPk(roleId);

  if (!role) {
    throw createError('Role not found', 404);
  }

  // Check if role is assigned to any admin users
  const adminUsersWithRole = await AdminUser.findAll({
    include: [
      {
        model: Role,
        through: { attributes: [] },
        where: { id: roleId },
      },
    ],
  });

  if (adminUsersWithRole.length > 0) {
    throw createError('Cannot delete role that is assigned to admin users', 400);
  }

  // Soft delete by deactivating
  await role.update({ isActive: false });
};

/**
 * Activate role
 */
export const activate = async (roleId: string): Promise<RoleResponse> => {
  const role = await Role.findByPk(roleId);

  if (!role) {
    throw createError('Role not found', 404);
  }

  await role.update({ isActive: true });
  return formatRoleResponse(role);
};

/**
 * Deactivate role
 */
export const deactivate = async (roleId: string): Promise<RoleResponse> => {
  const role = await Role.findByPk(roleId);

  if (!role) {
    throw createError('Role not found', 404);
  }

  await role.update({ isActive: false });
  return formatRoleResponse(role);
};

/**
 * Check if role exists
 */
export const exists = async (roleId: string): Promise<boolean> => {
  const role = await Role.findByPk(roleId);
  return !!role;
};

/**
 * Check if role is active
 */
export const isActive = async (roleId: string): Promise<boolean> => {
  const role = await Role.findByPk(roleId);
  return role?.isActive || false;
};

/**
 * Get role by name
 */
export const getByName = async (name: string): Promise<RoleResponse | null> => {
  const role = await Role.findOne({ where: { name } });

  if (!role) {
    return null;
  }

  return formatRoleResponse(role);
};
