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

// Inner layout component that uses the context
const DashboardLayoutInner = () => {
  const location = useLocation();
  const { isMobile, isOpen, closeSidebar } = useSidebar();
  
  const currentTitle = pageTitles[location.pathname] || 'Dashboard';

  return (
    <div className="h-screen flex bg-background">
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}
      
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header title={currentTitle} />
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 transition-all duration-300 ease-in-out">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

// Main layout component with provider
const DashboardLayout = () => {
  return (
    <SidebarProvider defaultCollapsed={false}>
      <DashboardLayoutInner />
    </SidebarProvider>
  );
};

export default DashboardLayout;