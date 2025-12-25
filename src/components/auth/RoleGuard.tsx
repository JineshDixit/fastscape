import { Navigate } from 'react-router-dom';
import { authService } from '@/api/services/auth';
import type { RoleGuardProps } from '@/common/interface/routeInterface';

/**
 * RoleGuard component for role and permission-based access control
 */
const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  requireAll = false,
  fallbackPath = '/dashboard'
}) => {
  // Check roles
  const hasRequiredRoles = () => {
    if (requiredRoles.length === 0) return true;
    
    if (requireAll) {
      return requiredRoles.every(role => authService.hasRole(role));
    } else {
      return requiredRoles.some(role => authService.hasRole(role));
    }
  };

  // Check permissions
  const hasRequiredPermissions = () => {
    if (requiredPermissions.length === 0) return true;
    
    if (requireAll) {
      return authService.hasAllPermissions(requiredPermissions);
    } else {
      return authService.hasAnyPermission(requiredPermissions);
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