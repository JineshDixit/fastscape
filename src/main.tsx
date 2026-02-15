import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes/Router';
import { AuthProvider } from './context/authContext';
import { Toaster } from '@/components/ui/sonner';
import { AuthDebugPanel } from '@/components/debug/AuthDebugPanel';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster />
      {import.meta.env.DEV && <AuthDebugPanel />}
    </AuthProvider>
  </StrictMode>,
);
