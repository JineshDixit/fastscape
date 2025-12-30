export interface ProtectedRouteProps {
  children: React.ReactNode;
}

export interface PublicRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export interface RoleGuardProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  requireAll?: boolean;
  fallbackPath?: string;
}

export interface AuthState {
  isAuthenticated: boolean | null;
  isLoading: boolean;
  user: any | null;
}
