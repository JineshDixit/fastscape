import { RolePolicy, Role, Policy } from '../../models';
import { AssignPolicyToRoleRequest, RoleResponse, PolicyResponse } from '../../common/interfaces/authTypes';
import { 
  formatRoleWithPoliciesResponse, 
  formatPolicyResponse, 
  getRoleWithPolicies,
  RoleWithPolicies,
  PolicyWithRoles
} from '../../utils/role.utils';
import { createError } from '../middleware/errorHandler';
import { validateRequiredFields } from '../../utils/validation.utils';

/**
 * Assign policy to role
 */
export const assignPolicy = async (assignData: AssignPolicyToRoleRequest): Promise<RoleResponse & { policies: PolicyResponse[] }> => {
  const { roleId, policyId } = assignData;

  // Validate required fields
  validateRequiredFields(assignData, ['roleId', 'policyId']);

  // Check if role exists and is active
  const role = await Role.findOne({ 
    where: { id: roleId, isActive: true } 
  });
  if (!role) {
    throw createError('Role not found or inactive', 404);
  }

  // Check if policy exists and is active
  const policy = await Policy.findOne({ 
    where: { id: policyId, isActive: true } 
  });
  if (!policy) {
    throw createError('Policy not found or inactive', 404);
  }

  // Check if assignment already exists
  const existingAssignment = await RolePolicy.findOne({
    where: { roleId, policyId }
  });

  if (existingAssignment) {
    throw createError('Policy is already assigned to this role', 409);
  }

  // Create assignment
  await RolePolicy.create({
    roleId,
    policyId,
  });

  // Get updated role with policies
  const updatedRole = await getRoleWithPolicies(roleId);
  return formatRoleWithPoliciesResponse(updatedRole!);
};

/**
 * Remove policy from role
 */
export const removePolicy = async (
  roleId: string,
  policyId: string
): Promise<RoleResponse & { policies: PolicyResponse[] }> => {
  // Check if assignment exists
  const assignment = await RolePolicy.findOne({
    where: { roleId, policyId }
  });

  if (!assignment) {
    throw createError('Policy is not assigned to this role', 404);
  }

  // Remove assignment
  await assignment.destroy();

  // Get updated role with policies
  const updatedRole = await getRoleWithPolicies(roleId);

  if (!updatedRole) {
    throw createError('Role not found', 404);
  }

  return formatRoleWithPoliciesResponse(updatedRole);
};

/**
 * Get all policies assigned to a role
 */
export const getRolePolicies = async (roleId: string): Promise<PolicyResponse[]> => {
  const role = await getRoleWithPolicies(roleId);

  if (!role) {
    throw createError('Role not found', 404);
  }

  const policies = (role as RoleWithPolicies).Policies || [];
  return policies.map((policy) => formatPolicyResponse(policy));
};

/**
 * Get all roles that have a specific policy
 */
export const getPolicyRoles = async (policyId: string): Promise<RoleResponse[]> => {
  const policy = await Policy.findByPk(policyId, {
    include: [
      {
        model: Role,
        through: { attributes: [] },
        where: { isActive: true },
        required: false,
      }
    ],
  });

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
 * Check if role has specific policy
 */
export const hasPolicy = async (roleId: string, policyId: string): Promise<boolean> => {
  const assignment = await RolePolicy.findOne({
    where: { roleId, policyId }
  });

  return !!assignment;
};

/**
 * Check if role has any of the specified policies
 */
export const hasAnyPolicy = async (roleId: string, policyIds: string[]): Promise<boolean> => {
  const assignments = await RolePolicy.findAll({
    where: { 
      roleId,
      policyId: policyIds
    }
  });

  return assignments.length > 0;
};

/**
 * Get all permissions for a role (from all assigned policies)
 */
export const getRolePermissions = async (roleId: string): Promise<string[]> => {
  const role = await getRoleWithPolicies(roleId);

  if (!role) {
    throw createError('Role not found', 404);
  }

  const policies = (role as RoleWithPolicies).Policies || [];
  const permissions = new Set<string>();

  // Collect all permissions from all policies
  policies.forEach((policy) => {
    policy.permissions.forEach((permission: string) => {
      permissions.add(permission);
    });
  });

  return Array.from(permissions);
};

/**
 * Check if role has specific permission
 */
export const hasPermission = async (roleId: string, permission: string): Promise<boolean> => {
  const permissions = await getRolePermissions(roleId);
  return permissions.includes(permission);
};

/**
 * Check if role has any of the specified permissions
 */
export const hasAnyPermission = async (roleId: string, permissions: string[]): Promise<boolean> => {
  const rolePermissions = await getRolePermissions(roleId);
  return permissions.some(permission => rolePermissions.includes(permission));
};

/**
 * Bulk assign policies to role
 */
export const bulkAssignPolicies = async (
  roleId: string,
  policyIds: string[]
): Promise<RoleResponse & { policies: PolicyResponse[] }> => {
  // Check if role exists and is active
  const role = await Role.findOne({ 
    where: { id: roleId, isActive: true } 
  });
  if (!role) {
    throw createError('Role not found or inactive', 404);
  }

  // Check if all policies exist and are active
  const policies = await Policy.findAll({
    where: { id: policyIds, isActive: true }
  });

  if (policies.length !== policyIds.length) {
    throw createError('One or more policies not found or inactive', 404);
  }

  // Get existing assignments
  const existingAssignments = await RolePolicy.findAll({
    where: { roleId, policyId: policyIds }
  });

  const existingPolicyIds = existingAssignments.map(assignment => assignment.policyId);
  const newPolicyIds = policyIds.filter(policyId => !existingPolicyIds.includes(policyId));

  // Create new assignments
  if (newPolicyIds.length > 0) {
    const assignmentData = newPolicyIds.map(policyId => ({
      roleId,
      policyId,
    }));

    await RolePolicy.bulkCreate(assignmentData);
  }

  // Get updated role with policies
  const updatedRole = await getRoleWithPolicies(roleId);
  return formatRoleWithPoliciesResponse(updatedRole!);
};

/**
 * Remove all policies from role
 */
export const removeAllPolicies = async (roleId: string): Promise<RoleResponse & { policies: PolicyResponse[] }> => {
  // Remove all assignments
  await RolePolicy.destroy({
    where: { roleId }
  });

  // Get updated role
  const updatedRole = await Role.findByPk(roleId);

  if (!updatedRole) {
    throw createError('Role not found', 404);
  }

  return {
    id: updatedRole.id,
    name: updatedRole.name,
    description: updatedRole.description,
    isActive: updatedRole.isActive,
    policies: [],
  };
};