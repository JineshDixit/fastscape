import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { SidebarProvider, useSidebar } from '@/context/sidebarContext';

// Page titles mapping
const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/bookings': 'Bookings',
  '/units': 'Units',
  '/clients': 'Clients',
  '/drivers': 'Drivers',
  '/financials': 'Financials',
};

const LayoutInner = () => {
  const location = useLocation();
  const { isMobile, isOpen, closeSidebar } = useSidebar();

  const currentTitle = pageTitles[location.pathname] || 'Dashboard';

  return (
    <div className="bg-background flex h-full w-full overflow-hidden">
      {isMobile && isOpen && (
        <div
          className="bg-opacity-50 fixed inset-0 z-40 bg-transparent transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}

      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title={currentTitle} />

        <main className="flex-1 overflow-y-auto p-6 transition-all duration-300 ease-in-out">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

const Layout = () => {
  return (
    <SidebarProvider defaultCollapsed={false}>
      <LayoutInner />
    </SidebarProvider>
  );
};

export default Layout;
