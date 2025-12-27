import { useAuthContext } from '@/context/authContext';

/**
 * Hook to manage authentication state for route protection
 * Now simplifies to using the global AuthContext
 */
export const useAuthGuard = () => {
  const { isAuthenticated, isLoading, user } = useAuthContext();

  return {
    isAuthenticated,
    isLoading,
    user
  };
};