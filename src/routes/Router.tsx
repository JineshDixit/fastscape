import LoginPage from '@/pages/auth/LoginPage';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PublicRoute from '@/components/auth/PublicRoute';
import RoleGuard from '@/components/auth/RoleGuard';
import Dashboard from '@/pages/Dashboard';
import Bookings from '@/pages/Bookings';
import BookingDetails from '@/pages/BookingDetails';
import Documents from '@/pages/Documents';
import Units from '@/pages/Units';
import Clients from '@/pages/Clients';
import ClientDetails from '@/pages/ClientDetails';
import ChauffeurList from '@/pages/Chauffeurs/ChauffeurList';
import ChauffeurDetails from '@/pages/Chauffeurs/ChauffeurDetails';

// ... (existing imports, but I need to be careful not to replace too much context)
// Actually I'll target the import and the route separately.

// Chunk 1: Import

import Financials from '@/pages/Financials';
import NotFound from '@/pages/NotFound';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import UnitsLayout from '@/components/units/UnitsLayout';
import VehicleDetails from '@/components/units/VehicleDetails';

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
        path: 'bookings',
        element: <Bookings />,
      },
      {
        path: 'bookings/:id',
        element: <BookingDetails />,
      },
      {
        path: 'documents',
        element: <Documents />,
      },
      {
        path: 'units',
        element: <UnitsLayout />,
        children: [
          {
            index: true,
            element: <Units />,
          },
          {
            path: ':id',
            element: <VehicleDetails />,
          },
        ],
      },
      {
        path: 'clients',
        children: [
          {
            index: true,
            element: <Clients />,
          },
          {
            path: ':id',
            element: <ClientDetails />,
          },
        ],
      },
      {
        path: 'drivers',
        children: [
          {
            index: true,
            element: <ChauffeurList />,
          },
          {
            path: ':id',
            element: <ChauffeurDetails />,
          },
        ],
      },
      {
        path: 'financials',
        element: (
          <RoleGuard requiredPermissions={['admin.content.read']} fallbackPath="/dashboard">
            <Financials />
          </RoleGuard>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
