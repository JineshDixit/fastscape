import { Navigate } from 'react-router-dom';
import { useAuthContext } from '@/context/authContext';
import type { RoleGuardProps } from '@/common/interface/routeInterface';

/**
 * RoleGuard component for role and permission-based access control
 */
const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  requireAll = false,
  fallbackPath = '/dashboard',
}) => {
  const { user, hasRole, hasPermission } = useAuthContext();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check roles
  const hasRequiredRoles = () => {
    if (requiredRoles.length === 0) return true;

    if (requireAll) {
      return requiredRoles.every((role) => hasRole(role));
    } else {
      return requiredRoles.some((role) => hasRole(role));
    }
  };

  // Check permissions
  const hasRequiredPermissions = () => {
    if (requiredPermissions.length === 0) return true;

    if (requireAll) {
      return requiredPermissions.every((permission) => hasPermission(permission));
    } else {
      return requiredPermissions.some((permission) => hasPermission(permission));
    }
  };

  // Check if user has access
  const hasAccess = hasRequiredRoles() && hasRequiredPermissions();

  if (!hasAccess) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

export default RoleGuard;
