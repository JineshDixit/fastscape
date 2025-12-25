import { Role, Policy } from '../models';
import { RoleResponse, PolicyResponse } from '../common/interfaces/authTypes';

/**
 * Format role response
 */
export const formatRoleResponse = (role: Role): RoleResponse => {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    isActive: role.isActive,
  };
};

/**
 * Format role response with policies
 */
export const formatRoleWithPoliciesResponse = (role: Role): RoleResponse & { policies: PolicyResponse[] } => {
  const policies = (role as any).Policies || [];
  
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    isActive: role.isActive,
    policies: policies.map((policy: any) => ({
      id: policy.id,
      name: policy.name,
      permissions: policy.permissions,
      description: policy.description,
      isActive: policy.isActive,
    })),
  };
};

/**
 * Format policy response
 */
export const formatPolicyResponse = (policy: Policy): PolicyResponse => {
  return {
    id: policy.id,
    name: policy.name,
    permissions: policy.permissions,
    description: policy.description,
    isActive: policy.isActive,
  };
};

/**
 * Get role with policies - centralized query
 */
export const getRoleWithPolicies = async (roleId: number): Promise<Role | null> => {
  return await Role.findByPk(roleId, {
    include: [
      {
        model: Policy,
        through: { attributes: [] },
        where: { isActive: true },
        required: false,
      }
    ],
  });
};

/**
 * Get policy with roles - centralized query
 */
export const getPolicyWithRoles = async (policyId: number): Promise<Policy | null> => {
  return await Policy.findByPk(policyId, {
    include: [
      {
        model: Role,
        through: { attributes: [] },
        where: { isActive: true },
        required: false,
      }
    ],
  });
};