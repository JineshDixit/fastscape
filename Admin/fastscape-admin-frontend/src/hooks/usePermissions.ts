import { useAuthContext } from '@/context/authContext';
import { PERMISSIONS } from '@/config/permissions';

/**
 * Custom hook for permission checking
 * Provides utility functions to check user permissions
 */
export const usePermissions = () => {
  const { user, hasPermission, hasAnyPermission } = useAuthContext();

  /**
   * Check if user has permission for a specific action on a module
   * @param module - The module name (e.g., 'bookings', 'vehicles')
   * @param action - The action name (e.g., 'create', 'read', 'update', 'delete')
   */
  const canPerformAction = (module: string, action: string): boolean => {
    // Super admin has all permissions
    if (hasPermission(PERMISSIONS.SUPER_ADMIN)) {
      return true;
    }

    // Get the permission list for the module and action
    const modulePermissions = (PERMISSIONS as any)[module.toUpperCase()];
    if (!modulePermissions) return false;

    const actionPermission = modulePermissions[action.toUpperCase()];
    if (!actionPermission) return false;

    // Check if it's a single permission or array
    if (Array.isArray(actionPermission)) {
      return hasAnyPermission(actionPermission);
    }

    return hasPermission(actionPermission);
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
    return hasPermission(PERMISSIONS.SUPER_ADMIN);
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
