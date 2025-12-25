import { Navigate } from 'react-router-dom';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import type { PublicRouteProps } from '@/common/interface/routeInterface';

/**
 * PublicRoute component for routes that should only be accessible
 * when user is NOT authenticated (like login page)
 */
const PublicRoute: React.FC<PublicRouteProps> = ({ 
  children, 
  redirectTo = '/dashboard' 
}) => {
  const { isAuthenticated, isLoading } = useAuthGuard();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated, redirect to dashboard or specified route
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // User is not authenticated, render the public content (login page)
  return <>{children}</>;
};

export default PublicRoute;