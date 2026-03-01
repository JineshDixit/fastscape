import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, Car, BookUser, LogOut, ChartPie, MapPin, Shield } from 'lucide-react';

import { cn } from '@/lib/utils';
import logo from '@/assets/Logo.png';
import { useSidebar } from '@/context/sidebarContext';
import { useAuthContext } from '@/context/authContext';
import type { SidebarItem } from '@/common/interface/sidebarInterface';
import { PERMISSIONS } from '@/config/permissions';
import { Button } from '../ui/button';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const sidebarItems: SidebarItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  {
    icon: Calendar,
    label: 'Bookings',
    path: '/bookings',
    requiredPermissions: [PERMISSIONS.BOOKINGS.LIST, PERMISSIONS.BOOKINGS.READ],
  },
  {
    icon: Car,
    label: 'Units',
    path: '/units',
    requiredPermissions: [PERMISSIONS.VEHICLES.LIST, PERMISSIONS.VEHICLES.READ],
  },
  {
    icon: Users,
    label: 'Clients',
    path: '/clients',
    requiredPermissions: [PERMISSIONS.CLIENTS.LIST, PERMISSIONS.CLIENTS.READ],
  },
  {
    icon: BookUser,
    label: 'Driver',
    path: '/drivers',
    requiredPermissions: [PERMISSIONS.CHAUFFEURS.LIST, PERMISSIONS.CHAUFFEURS.READ],
  },
  {
    icon: ChartPie,
    label: 'Financials',
    path: '/financials',
    requiredPermissions: [PERMISSIONS.FINANCIALS.LIST, PERMISSIONS.FINANCIALS.READ],
  },
  {
    icon: MapPin,
    label: 'Locations',
    path: '/locations',
    requiredPermissions: [PERMISSIONS.LOCATIONS.LIST, PERMISSIONS.LOCATIONS.READ],
  },
  {
    icon: Shield,
    label: 'Admin',
    path: '/admin-management',
    requiredPermissions: [PERMISSIONS.ADMIN.USERS.READ, PERMISSIONS.ADMIN.ROLES.READ, PERMISSIONS.ADMIN.POLICIES.READ],
  },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const { isCollapsed, isMobile, isOpen, closeSidebar } = useSidebar();
  const { logout, hasAnyPermission } = useAuthContext();

  const visibleSidebarItems = sidebarItems.filter((item) => {
    if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
      return true;
    }
    return hasAnyPermission(item.requiredPermissions);
  });

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/login');
    }
  };

  const handleNavClick = () => {
    if (isMobile) closeSidebar();
  };

  return (
    <div
      className={cn(
        'bg-background flex flex-col border-r border-gray-200 transition-all duration-300 ease-in-out',
        isCollapsed && !isMobile ? 'w-19' : 'w-64',
        isMobile ? 'fixed inset-y-0 left-0 z-50 h-screen' : 'relative',
        isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0',
      )}
    >
      {isCollapsed && !isMobile ? (
        <div className="p-5">
          <div className="bg-primary text-primary-foreground rounded-md px-2 py-1 text-lg font-bold">FS</div>
        </div>
      ) : null}
      {!isCollapsed && !isMobile ? (
        <div className="px-5 py-7.5">
          <img src={logo} alt="Fastscape" className="h-3.5 w-auto" />
        </div>
      ) : null}

      <nav className="flex-1 space-y-2 p-4">
        <TooltipProvider delayDuration={80}>
          {visibleSidebarItems.map((item) => {
            const Icon = item.icon;

            const navItem = (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-secondary text-foreground'
                      : 'text-foreground/65 hover:bg-secondary/70 hover:text-foreground',
                    isCollapsed && 'justify-center',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn(
                        'h-5 w-5 shrink-0',
                        isActive ? `text-primary` : 'text-foreground/65 group-hover:text-foreground',
                      )}
                    />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </>
                )}
              </NavLink>
            );

            if (!isCollapsed || isMobile) {
              return navItem;
            }

            return (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>{navItem}</TooltipTrigger>
                <TooltipContent side="right" align="center">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </nav>

      <div className="border-t border-gray-200 p-4">
        <TooltipProvider delayDuration={80}>
          {isCollapsed && !isMobile ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" onClick={handleLogout} className="group flex w-full justify-center px-3 py-2.5">
                  <LogOut className="text-foreground/65 group-hover:text-foreground h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Logout</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="group text-foreground/65 hover:text-foreground flex w-full items-center justify-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-gray-50"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span>Logout</span>
            </Button>
          )}
        </TooltipProvider>
      </div>
    </div>
  );
};

export default Sidebar;
