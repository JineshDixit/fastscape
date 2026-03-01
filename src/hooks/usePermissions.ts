import { useAuthContext } from '@/context/authContext';
import { ACTION_PERMISSIONS, PERMISSIONS } from '@/config/permissions';

/**
 * Custom hook for permission checking
 * Provides utility functions to check user permissions
 */
export const usePermissions = () => {
  const { user, hasPermission, hasAnyPermission, isSuperAdmin: isSuperAdminUser } = useAuthContext();

  /**
   * Check if user has permission for a specific action on a module
   * @param module - The module name (e.g., 'bookings', 'vehicles')
   * @param action - The action name (e.g., 'create', 'read', 'update', 'delete')
   */
  const canPerformAction = (module: string, action: string): boolean => {
    if (isSuperAdminUser()) {
      return true;
    }

    const moduleConfig = (ACTION_PERMISSIONS as Record<string, any>)[module];
    if (!moduleConfig) return false;
    const actionPermissions = moduleConfig[action];
    if (!actionPermissions) return false;
    const normalizedPermissions = Array.isArray(actionPermissions) ? actionPermissions : [actionPermissions];
    return hasAnyPermission(normalizedPermissions);
  };

  /**
   * Check if user can view a module
   */
  const canView = (module: string): boolean => {
    return canPerformAction(module, 'read') || canPerformAction(module, 'list');
  };

  /**
   * Check if user can create in a module
   */
  const canCreate = (module: string): boolean => {
    return canPerformAction(module, 'create');
  };

  /**
   * Check if user can update in a module
   */
  const canUpdate = (module: string): boolean => {
    return canPerformAction(module, 'update') || canPerformAction(module, 'write');
  };

  /**
   * Check if user can delete in a module
   */
  const canDelete = (module: string): boolean => {
    return canPerformAction(module, 'delete');
  };

  /**
   * Check if user can export from a module
   */
  const canExport = (module: string): boolean => {
    return canPerformAction(module, 'export');
  };

  /**
   * Check if user is super admin
   */
  const isSuperAdmin = (): boolean => {
    return isSuperAdminUser();
  };

  /**
   * Check if user has admin management access
   */
  const canManageAdmins = (): boolean => {
    return (
      isSuperAdmin() ||
      hasAnyPermission([PERMISSIONS.ADMIN.USERS.READ, PERMISSIONS.ADMIN.ROLES.READ, PERMISSIONS.ADMIN.POLICIES.READ])
    );
  };

  /**
   * Check if user can manage roles
   */
  const canManageRoles = (): boolean => {
    return (
      isSuperAdmin() ||
      hasAnyPermission([PERMISSIONS.ADMIN.ROLES.READ, PERMISSIONS.ADMIN.ROLES.UPDATE, PERMISSIONS.ADMIN.ROLES.CREATE])
    );
  };

  /**
   * Check if user can manage policies
   */
  const canManagePolicies = (): boolean => {
    return (
      isSuperAdmin() ||
      hasAnyPermission([
        PERMISSIONS.ADMIN.POLICIES.READ,
        PERMISSIONS.ADMIN.POLICIES.UPDATE,
        PERMISSIONS.ADMIN.POLICIES.CREATE,
      ])
    );
  };

  return {
    user,
    hasPermission,
    hasAnyPermission,
    canPerformAction,
    canView,
    canCreate,
    canUpdate,
    canDelete,
    canExport,
    isSuperAdmin,
    canManageAdmins,
    canManageRoles,
    canManagePolicies,
  };
};
