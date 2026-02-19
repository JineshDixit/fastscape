import LoginPage from '@/pages/auth/LoginPage';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PublicRoute from '@/components/auth/PublicRoute';
import RoleGuard from '@/components/auth/RoleGuard';
import Dashboard from '@/pages/Dashboard';
import Bookings from '@/pages/Bookings/Bookings';
import BookingDetails from '@/pages/Bookings/BookingDetails';
import Documents from '@/pages/Documents';
import Units from '@/pages/Units/Units';
import Clients from '@/pages/Clients/Clients';
import ClientDetails from '@/pages/Clients/ClientDetails';
import ChauffeurList from '@/pages/Chauffeurs/ChauffeurList';
import ChauffeurDetails from '@/pages/Chauffeurs/ChauffeurDetails';
import Financials from '@/pages/Financials/Financials';
import FinanceDetails from '@/pages/Financials/FinanceDetails';
import ProfilePage from '@/pages/Profile/ProfilePage';
import NotFound from '@/pages/NotFound';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import UnitsLayout from '@/pages/Units/UnitsLayout';
import VehicleDetails from '@/pages/Units/VehicleDetails';
import Locations from '@/pages/Locations/Locations';
import AdminManagement from '@/pages/AdminManagement/AdminManagement';
import { PERMISSIONS } from '@/config/permissions';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: 'login',
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'bookings',
        element: (
          <RoleGuard 
            requiredPermissions={[PERMISSIONS.BOOKINGS.LIST, PERMISSIONS.BOOKINGS.READ, PERMISSIONS.SUPER_ADMIN]} 
            fallbackPath="/dashboard"
          >
            <Bookings />
          </RoleGuard>
        ),
      },
      {
        path: 'bookings/:id',
        element: (
          <RoleGuard 
            requiredPermissions={[PERMISSIONS.BOOKINGS.VIEW, PERMISSIONS.BOOKINGS.READ, PERMISSIONS.SUPER_ADMIN]} 
            fallbackPath="/bookings"
          >
            <BookingDetails />
          </RoleGuard>
        ),
      },
      {
        path: 'documents',
        element: (
          <RoleGuard 
            requiredPermissions={[PERMISSIONS.DOCUMENTS.LIST, PERMISSIONS.DOCUMENTS.READ, PERMISSIONS.SUPER_ADMIN]} 
            fallbackPath="/dashboard"
          >
            <Documents />
          </RoleGuard>
        ),
      },
      {
        path: 'units',
        element: (
          <RoleGuard 
            requiredPermissions={[PERMISSIONS.VEHICLES.LIST, PERMISSIONS.VEHICLES.READ, PERMISSIONS.SUPER_ADMIN]} 
            fallbackPath="/dashboard"
          >
            <UnitsLayout />
          </RoleGuard>
        ),
        children: [
          {
            index: true,
            element: <Units />,
          },
          {
            path: ':id',
            element: (
              <RoleGuard 
                requiredPermissions={[PERMISSIONS.VEHICLES.VIEW, PERMISSIONS.VEHICLES.READ, PERMISSIONS.SUPER_ADMIN]} 
                fallbackPath="/units"
              >
                <VehicleDetails />
              </RoleGuard>
            ),
          },
        ],
      },
      {
        path: 'clients',
        children: [
          {
            index: true,
            element: (
              <RoleGuard 
                requiredPermissions={[PERMISSIONS.CLIENTS.LIST, PERMISSIONS.CLIENTS.READ, PERMISSIONS.SUPER_ADMIN]} 
                fallbackPath="/dashboard"
              >
                <Clients />
              </RoleGuard>
            ),
          },
          {
            path: ':id',
            element: (
              <RoleGuard 
                requiredPermissions={[PERMISSIONS.CLIENTS.VIEW, PERMISSIONS.CLIENTS.READ, PERMISSIONS.SUPER_ADMIN]} 
                fallbackPath="/clients"
              >
                <ClientDetails />
              </RoleGuard>
            ),
          },
        ],
      },
      {
        path: 'drivers',
        children: [
          {
            index: true,
            element: (
              <RoleGuard 
                requiredPermissions={[PERMISSIONS.CHAUFFEURS.LIST, PERMISSIONS.CHAUFFEURS.READ, PERMISSIONS.SUPER_ADMIN]} 
                fallbackPath="/dashboard"
              >
                <ChauffeurList />
              </RoleGuard>
            ),
          },
          {
            path: ':id',
            element: (
              <RoleGuard 
                requiredPermissions={[PERMISSIONS.CHAUFFEURS.VIEW, PERMISSIONS.CHAUFFEURS.READ, PERMISSIONS.SUPER_ADMIN]} 
                fallbackPath="/drivers"
              >
                <ChauffeurDetails />
              </RoleGuard>
            ),
          },
        ],
      },
      {
        path: 'financials',
        children: [
          {
            index: true,
            element: (
              <RoleGuard 
                requiredPermissions={[
                  PERMISSIONS.FINANCIALS.LIST, 
                  PERMISSIONS.FINANCIALS.READ, 
                  PERMISSIONS.ADMIN.CONTENT.READ,
                  PERMISSIONS.SUPER_ADMIN
                ]} 
                fallbackPath="/dashboard"
              >
                <Financials />
              </RoleGuard>
            ),
          },
          {
            path: ':id',
            element: (
              <RoleGuard 
                requiredPermissions={[
                  PERMISSIONS.FINANCIALS.VIEW, 
                  PERMISSIONS.FINANCIALS.READ, 
                  PERMISSIONS.ADMIN.CONTENT.READ,
                  PERMISSIONS.SUPER_ADMIN
                ]} 
                fallbackPath="/financials"
              >
                <FinanceDetails />
              </RoleGuard>
            ),
          },
        ],
      },
      {
        path: 'locations',
        children: [
          {
            index: true,
            element: (
              <RoleGuard 
                requiredPermissions={[PERMISSIONS.LOCATIONS.LIST, PERMISSIONS.LOCATIONS.READ, PERMISSIONS.SUPER_ADMIN]} 
                fallbackPath="/dashboard"
              >
                <Locations />
              </RoleGuard>
            ),
          }
        ]
      },
      {
        path: 'admin-management',
        element: (
          <RoleGuard 
            requiredPermissions={[
              PERMISSIONS.ADMIN.USERS.READ,
              PERMISSIONS.ADMIN.ROLES.READ,
              PERMISSIONS.ADMIN.POLICIES.READ,
              PERMISSIONS.SUPER_ADMIN
            ]} 
            fallbackPath="/dashboard"
          >
            <AdminManagement />
          </RoleGuard>
        ),
      }
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
