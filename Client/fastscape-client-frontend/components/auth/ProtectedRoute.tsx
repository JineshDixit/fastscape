'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/axios';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
  fallback?: ReactNode;
}

/**
 * ProtectedRoute component that handles authentication-based routing
 *
 * @param children - Content to render when user meets auth requirements
 * @param redirectTo - Path to redirect to when auth requirement not met (default: '/')
 * @param requireAuth - Whether authentication is required (default: true)
 * @param fallback - Component to show while checking authentication
 */
export const ProtectedRoute = ({
  children,
  redirectTo = '/',
  requireAuth = true,
  fallback = <div className="flex min-h-screen items-center justify-center">Loading...</div>,
}: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        router.push(redirectTo);
      } else if (!requireAuth && isAuthenticated) {
        // For pages that should only be accessible when NOT authenticated (like login page)
        router.push('/dashboard'); // or wherever authenticated users should go
      }
    }
  }, [isAuthenticated, isLoading, requireAuth, redirectTo, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return <>{fallback}</>;
  }

  // Show content if auth requirements are met
  if ((requireAuth && isAuthenticated) || (!requireAuth && !isAuthenticated)) {
    return <>{children}</>;
  }

  // Don't render anything while redirecting
  return null;
};

export default ProtectedRoute;
