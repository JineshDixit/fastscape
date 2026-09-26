import { Navigate } from 'react-router-dom';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import type { PublicRouteProps } from '@/common/interface/routeInterface';

/**
 * PublicRoute component for routes that should only be accessible
 * when user is NOT authenticated (like login page)
 */
const PublicRoute: React.FC<PublicRouteProps> = ({ children, redirectTo = '/dashboard' }) => {
  const { isAuthenticated } = useAuthGuard();

  // If authenticated, redirect to dashboard or specified route
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // User is not authenticated, render the public content (login page)
  return <>{children}</>;
};

export default PublicRoute;
