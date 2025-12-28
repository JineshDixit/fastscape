import LoginPage from "@/pages/auth/LoginPage";
import Layout from "@/components/layout/Layout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PublicRoute from "@/components/auth/PublicRoute";
import RoleGuard from "@/components/auth/RoleGuard";
import Dashboard from "@/pages/Dashboard";
import Bookings from "@/pages/Bookings";
import Units from "@/pages/Units";
import Clients from "@/pages/Clients";
import Drivers from "@/pages/Drivers";
import Financials from "@/pages/Financials";
import NotFound from "@/pages/NotFound";
import { createBrowserRouter, Navigate } from "react-router-dom";

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />
  },
  {
    path: '/login',
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    )
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
        element: <Dashboard />
      },
      {
        path: 'bookings',
        element: <Bookings />
      },
      {
        path: 'units',
        element: <Units />
      },
      {
        path: "units/:id",
        element: <Units />
      },
      {
        path: 'clients',
        element: <Clients />
      },
      {
        path: 'drivers',
        element: <Drivers />
      },
      {
        path: 'financials',
        element: (
          <RoleGuard 
            requiredPermissions={['admin.content.read']}
            fallbackPath="/dashboard"
          >
            <Financials />
          </RoleGuard>
        )
      }
    ]
  },
  {
    path: '*',
    element: <NotFound />
  }
])