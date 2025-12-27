import { Role, Policy } from '../models';
import { RoleResponse, PolicyResponse } from '../common/interfaces/authTypes';
import { Includeable } from 'sequelize';

/**
 * Interface representing Role with its Policies for strict typing
 */
export interface RoleWithPolicies extends Role {
  Policies?: Policy[];
}

/**
 * Interface representing Policy with its Roles for strict typing
 */
export interface PolicyWithRoles extends Policy {
  Roles?: Role[];
}

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
 * Industrial standard: Explicit type mapping for concatenated responses.
 */
export const formatRoleWithPoliciesResponse = (role: Role | RoleWithPolicies): RoleResponse & { policies: PolicyResponse[] } => {
  const roleWithAssoc = role as RoleWithPolicies;
  const policies = roleWithAssoc.Policies || [];
  
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    isActive: role.isActive,
    policies: policies.map((policy) => ({
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
 * Centralized include for Role with Policies
 */
export const ROLE_WITH_POLICIES_INCLUDE: Includeable[] = [
  {
    model: Policy,
    through: { attributes: [] },
    where: { isActive: true },
    required: false,
  }
];

/**
 * Centralized include for Policy with Roles
 */
export const POLICY_WITH_ROLES_INCLUDE: Includeable[] = [
  {
    model: Role,
    through: { attributes: [] },
    where: { isActive: true },
    required: false,
  }
];

/**
 * Get role with policies - centralized query
 */
export const getRoleWithPolicies = async (roleId: string): Promise<RoleWithPolicies | null> => {
  const role = await Role.findByPk(roleId, {
    include: ROLE_WITH_POLICIES_INCLUDE,
  });
  return role as RoleWithPolicies | null;
};

/**
 * Get policy with roles - centralized query
 */
export const getPolicyWithRoles = async (policyId: string): Promise<PolicyWithRoles | null> => {
  const policy = await Policy.findByPk(policyId, {
    include: POLICY_WITH_ROLES_INCLUDE,
  });
  return policy as PolicyWithRoles | null;
};