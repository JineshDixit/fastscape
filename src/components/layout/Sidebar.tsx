import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, Car, BookUser, LogOut, ChartPie } from 'lucide-react';
import { cn } from '@/lib/utils';
import logo from '@/assets/Logo.png';
import { useSidebar } from '@/context/sidebarContext';
import { useAuthContext } from '@/context/authContext';
import type { SidebarItem } from '@/common/interface/sidebarInterface';
import { Button } from '../ui/button';

const sidebarItems: SidebarItem[] = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    path: '/dashboard',
  },
  {
    icon: Calendar,
    label: 'Bookings',
    path: '/bookings',
  },
  {
    icon: Car,
    label: 'Units',
    path: '/units',
  },
  {
    icon: Users,
    label: 'Clients',
    path: '/clients',
  },
  {
    icon: BookUser,
    label: 'Drivers',
    path: '/drivers',
  },
  {
    icon: ChartPie,
    label: 'Financials',
    path: '/financials',
  },
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isCollapsed, isMobile, isOpen, closeSidebar } = useSidebar();

  const { logout } = useAuthContext();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      navigate('/login');
    }
  };

  const handleNavClick = () => {
    if (isMobile) {
      closeSidebar();
    }
  };

  return (
    <div
      className={cn(
        'bg-background flex flex-col border-r border-gray-200 transition-all duration-300 ease-in-out',
        isCollapsed && !isMobile ? 'w-18' : 'w-64',
        isMobile ? 'fixed inset-y-0 left-0 z-50 h-screen' : 'relative',
        isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0',
      )}
    >
      <div className="px-5 py-7.5">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center">
              <img src={logo} alt="Fastscape" className="h-3.5 w-auto" />
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-secondary text-foreground'
                  : 'text-foreground/65 group-hover:text-foreground hover:text-foreground hover:bg-gray-50',
                isCollapsed && 'justify-center',
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 shrink-0',
                  isActive ? 'text-primary' : 'text-foreground/65 group-hover:text-foreground',
                )}
              />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-4">
        <Button
          variant={'ghost'}
          onClick={handleLogout}
          className={cn(
            'group text-foreground/65 hover:text-foreground flex w-full items-center justify-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50',
            isCollapsed && 'justify-center',
          )}
        >
          <LogOut className="text-foreground/65 group-hover:text-foreground h-5 w-5 shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
