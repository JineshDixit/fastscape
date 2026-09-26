import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { SidebarProvider, useSidebar } from '@/context/sidebarContext';
import { generateBreadcrumbs } from '@/utils/breadcrumb.utils';

const LayoutInner = () => {
  const location = useLocation();
  const { isMobile, isOpen, closeSidebar } = useSidebar();

  const breadcrumbs = generateBreadcrumbs(location.pathname);

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
        <Header breadcrumbs={breadcrumbs} />

        <main className="flex-1 overflow-y-auto p-6 transition-all duration-300 ease-in-out">
          <Outlet />
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
