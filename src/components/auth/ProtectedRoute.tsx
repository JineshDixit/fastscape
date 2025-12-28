import { Navigate, useLocation } from "react-router-dom";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import type { ProtectedRouteProps } from "@/common/interface/routeInterface";
import { Spinner } from "@/components/ui/spinner";

/**
 * ProtectedRoute component that checks authentication status
 * and redirects to login if user is not authenticated
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthGuard();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Spinner className="size-10 text-primary" />
      </div>
    );
  }

  // If not authenticated, redirect to login with return URL
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
