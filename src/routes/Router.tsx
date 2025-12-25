import LoginPage from "@/pages/auth/LoginPage";
import DashboardLayout from "@/components/layout/DashboardLayout";
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
    element: <LoginPage />
  },
  {
    path: '/',
    element: <DashboardLayout />,
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
        path: 'clients',
        element: <Clients />
      },
      {
        path: 'drivers',
        element: <Drivers />
      },
      {
        path: 'financials',
        element: <Financials />
      }
    ]
  },
  {
    path: '*',
    element: <NotFound />
  }
])