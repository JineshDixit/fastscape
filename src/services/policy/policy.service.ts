import { Policy, Role } from '../../models';
import { CreatePolicyRequest, UpdatePolicyRequest, PolicyResponse } from '../../common/interfaces/authTypes';
import { formatPolicyResponse, getPolicyWithRoles, PolicyWithRoles } from '../../utils/role.utils';
import { createError } from '../middleware/errorHandler';
import { validateRequiredFields, validateArrayLength } from '../../utils/validation.utils';
import { Op } from 'sequelize';
import { ALL_PERMISSION_PRESETS, PERMISSION_PRESET_GROUPS } from '../../common/constants/permissionPresets';

const ALLOWED_PERMISSIONS = new Set(ALL_PERMISSION_PRESETS);

/**
 * Validate permissions array
 */
const validatePermissions = (permissions: string[]): string[] => {
  if (!Array.isArray(permissions)) {
    throw createError('Permissions must be an array', 400);
  }

  validateArrayLength(permissions, 1, 50, 'Permissions');

  // Check if all permissions are strings and not empty
  const invalidPermissions = permissions.filter(
    (permission) => typeof permission !== 'string' || permission.trim() === '',
  );

  if (invalidPermissions.length > 0) {
    throw createError('All permissions must be non-empty strings', 400);
  }

  const normalizedPermissions = permissions.map((permission) => permission.trim());

  // Check for duplicate permissions
  const uniquePermissions = new Set(normalizedPermissions);
  if (uniquePermissions.size !== normalizedPermissions.length) {
    throw createError('Duplicate permissions are not allowed', 400);
  }

  const unsupportedPermissions = normalizedPermissions.filter((permission) => !ALLOWED_PERMISSIONS.has(permission));

  if (unsupportedPermissions.length > 0) {
    throw createError(
      `Unsupported permissions found: ${unsupportedPermissions.join(', ')}. Use permission presets only.`,
      400,
    );
  }

  return normalizedPermissions;
};

/**
 * Create new policy
 */
export const create = async (policyData: CreatePolicyRequest): Promise<PolicyResponse> => {
  const { name, permissions, description } = policyData;

  // Validate required fields
  validateRequiredFields(policyData, ['name', 'permissions']);
  const normalizedPermissions = validatePermissions(permissions);

  // Check if policy already exists
  const existingPolicy = await Policy.findOne({ where: { name } });
  if (existingPolicy) {
    throw createError('Policy with this name already exists', 409);
  }

  // Create policy
  const policy = await Policy.create({
    name,
    permissions: normalizedPermissions,
    description,
    isActive: true,
  });

  return formatPolicyResponse(policy);
};

/**
 * Get policy by ID
 */
export const getById = async (policyId: string): Promise<PolicyResponse> => {
  const policy = await Policy.findByPk(policyId);

  if (!policy) {
    throw createError('Policy not found', 404);
  }

  return formatPolicyResponse(policy);
};

/**
 * Get all policies with pagination
 */
export const getAll = async (
  page: number = 1,
  limit: number = 20,
  search?: string,
  isActive?: boolean,
): Promise<{ policies: PolicyResponse[]; total: number; totalPages: number }> => {
  const offset = (page - 1) * limit;

  const whereClause: any = {};

  if (search) {
    whereClause[Op.or] = [{ name: { [Op.iLike]: `%${search}%` } }, { description: { [Op.iLike]: `%${search}%` } }];
  }

  if (isActive !== undefined) {
    whereClause.isActive = isActive;
  }

  const { rows: policies, count: total } = await Policy.findAndCountAll({
    where: whereClause,
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });

  return {
    policies: policies.map(formatPolicyResponse),
    total,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Update policy
 */
export const update = async (policyId: string, updateData: UpdatePolicyRequest): Promise<PolicyResponse> => {
  const policy = await Policy.findByPk(policyId);

  if (!policy) {
    throw createError('Policy not found', 404);
  }

  // If name is being updated, check for duplicates
  if (updateData.name) {
    const existingPolicy = await Policy.findOne({
      where: {
        name: updateData.name,
        id: { [Op.ne]: policyId },
      },
    });

    if (existingPolicy) {
      throw createError('Policy with this name already exists', 409);
    }
  }

  // Validate permissions if being updated
  if (updateData.permissions) {
    updateData.permissions = validatePermissions(updateData.permissions);
  }

  // Update policy
  await policy.update(updateData);

  return formatPolicyResponse(policy);
};

/**
 * Delete policy (soft delete by deactivating)
 */
export const remove = async (policyId: string): Promise<void> => {
  const policy = await Policy.findByPk(policyId);

  if (!policy) {
    throw createError('Policy not found', 404);
  }

  // Check if policy is assigned to any roles
  const rolesWithPolicy = await Role.findAll({
    include: [
      {
        model: Policy,
        through: { attributes: [] },
        where: { id: policyId },
      },
    ],
  });

  if (rolesWithPolicy.length > 0) {
    throw createError('Cannot delete policy that is assigned to roles', 400);
  }

  // Soft delete by deactivating
  await policy.update({ isActive: false });
};

/**
 * Add permission to policy
 */
export const addPermission = async (policyId: string, permission: string): Promise<PolicyResponse> => {
  const policy = await Policy.findByPk(policyId);

  if (!policy) {
    throw createError('Policy not found', 404);
  }

  if (typeof permission !== 'string' || permission.trim() === '') {
    throw createError('Permission must be a non-empty string', 400);
  }

  const trimmedPermission = permission.trim();

  if (!ALLOWED_PERMISSIONS.has(trimmedPermission)) {
    throw createError(`Unsupported permission: ${trimmedPermission}. Use permission presets only.`, 400);
  }

  // Check if permission already exists
  if (policy.permissions.includes(trimmedPermission)) {
    throw createError('Permission already exists in this policy', 409);
  }

  // Add permission
  const updatedPermissions = [...policy.permissions, trimmedPermission];
  await policy.update({ permissions: updatedPermissions });

  return formatPolicyResponse(policy);
};

/**
 * Remove permission from policy
 */
export const removePermission = async (policyId: string, permission: string): Promise<PolicyResponse> => {
  const policy = await Policy.findByPk(policyId);

  if (!policy) {
    throw createError('Policy not found', 404);
  }

  // Check if permission exists
  if (!policy.permissions.includes(permission)) {
    throw createError('Permission not found in this policy', 404);
  }

  // Remove permission
  const updatedPermissions = policy.permissions.filter((p) => p !== permission);

  if (updatedPermissions.length === 0) {
    throw createError('Cannot remove all permissions from policy', 400);
  }

  await policy.update({ permissions: updatedPermissions });

  return formatPolicyResponse(policy);
};

/**
 * Get roles that have this policy
 */
export const getRoles = async (policyId: string): Promise<any[]> => {
  const policy = await getPolicyWithRoles(policyId);

  if (!policy) {
    throw createError('Policy not found', 404);
  }

  const roles = (policy as PolicyWithRoles).Roles || [];

  return roles.map((role) => ({
    id: role.id,
    name: role.name,
    description: role.description,
    isActive: role.isActive,
  }));
};

/**
 * Activate policy
 */
export const activate = async (policyId: string): Promise<PolicyResponse> => {
  const policy = await Policy.findByPk(policyId);

  if (!policy) {
    throw createError('Policy not found', 404);
  }

  await policy.update({ isActive: true });
  return formatPolicyResponse(policy);
};

/**
 * Deactivate policy
 */
export const deactivate = async (policyId: string): Promise<PolicyResponse> => {
  const policy = await Policy.findByPk(policyId);

  if (!policy) {
    throw createError('Policy not found', 404);
  }

  await policy.update({ isActive: false });
  return formatPolicyResponse(policy);
};

/**
 * Check if policy exists
 */
export const exists = async (policyId: string): Promise<boolean> => {
  const policy = await Policy.findByPk(policyId);
  return !!policy;
};

/**
 * Check if policy is active
 */
export const isActive = async (policyId: string): Promise<boolean> => {
  const policy = await Policy.findByPk(policyId);
  return policy?.isActive || false;
};

/**
 * Get policy by name
 */
export const getByName = async (name: string): Promise<PolicyResponse | null> => {
  const policy = await Policy.findOne({ where: { name } });

  if (!policy) {
    return null;
  }

  return formatPolicyResponse(policy);
};

/**
 * Search policies by permission
 */
export const searchByPermission = async (permission: string): Promise<PolicyResponse[]> => {
  const policies = await Policy.findAll({
    where: {
      permissions: {
        [Op.contains]: [permission],
      },
      isActive: true,
    },
    order: [['name', 'ASC']],
  });

  return policies.map(formatPolicyResponse);
};

/**
 * Get grouped permission presets for policy configuration.
 */
export const getPermissionPresets = async (): Promise<{
  groups: Array<{ key: string; label: string; permissions: string[] }>;
  allPermissions: string[];
}> => {
  return {
    groups: PERMISSION_PRESET_GROUPS.map((group) => ({
      key: group.key,
      label: group.label,
      permissions: group.permissions,
    })),
    allPermissions: ALL_PERMISSION_PRESETS,
  };
};
