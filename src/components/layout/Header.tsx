import { Bell, Settings, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useSidebar } from '@/context/sidebarContext';
import { useAuthContext } from '@/context/authContext';
import { useNavigate } from 'react-router-dom';
import type { FC } from 'react';
import type { HeaderProps } from '@/common/interface/headerInterface';

const Header: FC<HeaderProps> = ({ breadcrumbs }) => {
  const { toggleSidebar } = useSidebar();
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const fullName = user?.fullName || 'Guest User';
  const initials = user?.firstName && user?.lastName ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : 'GU';
  const roleName = user?.roles?.[0]?.name || 'No Role';

  return (
    <header className="px-6 pt-4.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="m-0! py-2! pr-0! pl-2! hover:bg-transparent" onClick={toggleSidebar}>
            <PanelLeft className="text-foreground h-5! w-5!" />
          </Button>
          <Separator orientation="vertical" className="bg-foreground/20 h-4.5! w-[1.5px]! rounded-full"></Separator>
          <div className="flex flex-col gap-1">
            {breadcrumbs && breadcrumbs.length > 0 && (
              <Breadcrumb>
                <BreadcrumbList className="items-center">
                  {breadcrumbs.map((item, index) => (
                    <div key={index} className="flex items-center">
                      <BreadcrumbItem>
                        {index === breadcrumbs.length - 1 ? (
                          <BreadcrumbPage className="text-foreground pb-0.5 text-xl font-semibold">{item.label}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              if (item.href) {
                                navigate(item.href);
                              }
                            }}
                          >
                            {item.label}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {index < breadcrumbs.length - 1 && (
                        <BreadcrumbSeparator />
                      )}
                    </div>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="m-0! p-2!">
              <Settings className="text-foreground h-5! w-5!" />
            </Button>

            <Button variant="ghost" className="relative m-0! p-2!">
              <Bell className="text-foreground h-5! w-5!" />
              {/* <span className="absolute top-1 right-2 h-3 w-3 bg-destructive rounded-full"/> */}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="" alt={fullName} />
              <AvatarFallback className="bg-blue-100 text-sm font-medium text-blue-600">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start pb-0.5 text-left">
              <span className="text-foreground text-sm font-medium">{fullName}</span>
              <span className="text-foreground/50 text-xs">{roleName}</span>
            </div>
          </div>
        </div>
      </div>
      <Separator className="bg-foreground/10 mt-4.5 h-[1.5px]! rounded-full" />
    </header>
  );
};

export default Header;
