import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PERMISSIONS } from '@/config/permissions';

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const Layout = lazy(() => import('@/components/layout/Layout'));
const ProtectedRoute = lazy(() => import('@/components/auth/ProtectedRoute'));
const PublicRoute = lazy(() => import('@/components/auth/PublicRoute'));
const RoleGuard = lazy(() => import('@/components/auth/RoleGuard'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Bookings = lazy(() => import('@/pages/Bookings/Bookings'));
const BookingDetails = lazy(() => import('@/pages/Bookings/BookingDetails'));
const Documents = lazy(() => import('@/pages/Documents'));
const Units = lazy(() => import('@/pages/Units/Units'));
const UnitsLayout = lazy(() => import('@/pages/Units/UnitsLayout'));
const VehicleDetails = lazy(() => import('@/pages/Units/VehicleDetails'));
const Clients = lazy(() => import('@/pages/Clients/Clients'));
const ClientDetails = lazy(() => import('@/pages/Clients/ClientDetails'));
const ChauffeurList = lazy(() => import('@/pages/Chauffeurs/ChauffeurList'));
const ChauffeurDetails = lazy(() => import('@/pages/Chauffeurs/ChauffeurDetails'));
const Financials = lazy(() => import('@/pages/Financials/Financials'));
const FinanceDetails = lazy(() => import('@/pages/Financials/FinanceDetails'));
const ProfilePage = lazy(() => import('@/pages/Profile/ProfilePage'));
const Locations = lazy(() => import('@/pages/Locations/Locations'));
const AdminManagement = lazy(() => import('@/pages/AdminManagement/AdminManagement'));
const NotFound = lazy(() => import('@/pages/NotFound'));

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
          <RoleGuard requiredPermissions={[PERMISSIONS.BOOKINGS.LIST, PERMISSIONS.BOOKINGS.READ]} fallbackPath="/dashboard">
            <Bookings />
          </RoleGuard>
        ),
      },
      {
        path: 'bookings/:id',
        element: (
          <RoleGuard requiredPermissions={[PERMISSIONS.BOOKINGS.VIEW, PERMISSIONS.BOOKINGS.READ]} fallbackPath="/bookings">
            <BookingDetails />
          </RoleGuard>
        ),
      },
      {
        path: 'documents',
        element: (
          <RoleGuard requiredPermissions={[PERMISSIONS.DOCUMENTS.LIST, PERMISSIONS.DOCUMENTS.READ]} fallbackPath="/dashboard">
            <Documents />
          </RoleGuard>
        ),
      },
      {
        path: 'units',
        element: (
          <RoleGuard requiredPermissions={[PERMISSIONS.VEHICLES.LIST, PERMISSIONS.VEHICLES.READ]} fallbackPath="/dashboard">
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
              <RoleGuard requiredPermissions={[PERMISSIONS.VEHICLES.VIEW, PERMISSIONS.VEHICLES.READ]} fallbackPath="/units">
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
              <RoleGuard requiredPermissions={[PERMISSIONS.CLIENTS.LIST, PERMISSIONS.CLIENTS.READ]} fallbackPath="/dashboard">
                <Clients />
              </RoleGuard>
            ),
          },
          {
            path: ':id',
            element: (
              <RoleGuard requiredPermissions={[PERMISSIONS.CLIENTS.VIEW, PERMISSIONS.CLIENTS.READ]} fallbackPath="/clients">
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
                requiredPermissions={[PERMISSIONS.CHAUFFEURS.LIST, PERMISSIONS.CHAUFFEURS.READ]}
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
                requiredPermissions={[PERMISSIONS.CHAUFFEURS.VIEW, PERMISSIONS.CHAUFFEURS.READ]}
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
                requiredPermissions={[PERMISSIONS.FINANCIALS.LIST, PERMISSIONS.FINANCIALS.READ]}
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
                requiredPermissions={[PERMISSIONS.FINANCIALS.VIEW, PERMISSIONS.FINANCIALS.READ]}
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
              <RoleGuard requiredPermissions={[PERMISSIONS.LOCATIONS.LIST, PERMISSIONS.LOCATIONS.READ]} fallbackPath="/dashboard">
                <Locations />
              </RoleGuard>
            ),
          },
        ],
      },
      {
        path: 'admin-management',
        element: (
          <RoleGuard
            requiredPermissions={[
              PERMISSIONS.ADMIN.USERS.READ,
              PERMISSIONS.ADMIN.ROLES.READ,
              PERMISSIONS.ADMIN.POLICIES.READ,
            ]}
            fallbackPath="/dashboard"
          >
            <AdminManagement />
          </RoleGuard>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
], {
  basename: '/admin',
});
