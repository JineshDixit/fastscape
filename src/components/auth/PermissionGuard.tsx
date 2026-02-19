import { type ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionGuardProps {
  children: ReactNode;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  module?: string;
  action?: string;
}

/**
 * PermissionGuard component for conditional rendering based on permissions
 * Use this to show/hide UI elements based on user permissions
 * 
 * @example
 * // Using specific permissions
 * <PermissionGuard permissions={['booking:create']}>
 *   <Button>Create Booking</Button>
 * </PermissionGuard>
 * 
 * @example
 * // Using module and action
 * <PermissionGuard module="bookings" action="create">
 *   <Button>Create Booking</Button>
 * </PermissionGuard>
 * 
 * @example
 * // With fallback
 * <PermissionGuard 
 *   permissions={['booking:delete']} 
 *   fallback={<span>No permission</span>}
 * >
 *   <Button>Delete</Button>
 * </PermissionGuard>
 */
const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permissions = [],
  requireAll = false,
  fallback = null,
  module,
  action,
}) => {
  const { hasPermission, hasAnyPermission, canPerformAction, isSuperAdmin } = usePermissions();

  // Super admin has all permissions
  if (isSuperAdmin()) {
    return <>{children}</>;
  }

  let hasAccess = false;

  // Check using module and action
  if (module && action) {
    hasAccess = canPerformAction(module, action);
  }
  // Check using specific permissions
  else if (permissions.length > 0) {
    if (requireAll) {
      hasAccess = permissions.every((permission) => hasPermission(permission));
    } else {
      hasAccess = hasAnyPermission(permissions);
    }
  }
  // No permissions specified, allow access
  else {
    hasAccess = true;
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default PermissionGuard;
