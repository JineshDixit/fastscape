import { Settings, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
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
  const currentPageLabel = breadcrumbs?.[breadcrumbs.length - 1]?.label || 'Dashboard';

  return (
    <header className="px-3 pt-3 sm:px-4 sm:pt-4.5 lg:px-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Button variant="ghost" className="m-0! px-2! py-2! hover:bg-transparent" onClick={toggleSidebar}>
            <PanelLeft className="text-foreground h-5! w-5!" />
          </Button>
          <Separator
            orientation="vertical"
            className="bg-foreground/20 hidden h-4.5! w-[1.5px]! rounded-full sm:block"
          ></Separator>
          <div className="min-w-0">
            <p className="text-foreground truncate text-base font-semibold sm:hidden">{currentPageLabel}</p>
            {breadcrumbs && breadcrumbs.length > 0 && (
              <Breadcrumb className="hidden sm:block">
                <BreadcrumbList className="items-center">
                  {breadcrumbs.map((item, index) => (
                    <div key={index} className="flex items-center">
                      <BreadcrumbItem>
                        {index === breadcrumbs.length - 1 ? (
                          <BreadcrumbPage className="text-foreground max-w-[40vw] truncate pb-0.5 text-lg font-semibold lg:max-w-none lg:text-xl">
                            {item.label}
                          </BreadcrumbPage>
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
                      {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                    </div>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="m-0! p-2!" onClick={() => navigate('/profile')}>
              <Settings className="text-foreground h-5! w-5!" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="" alt={fullName} />
              <AvatarFallback className="bg-blue-100 text-sm font-medium text-blue-600">{initials}</AvatarFallback>
            </Avatar>
            <div className="hidden flex-col items-start pb-0.5 text-left md:flex">
              <span className="text-foreground text-sm font-medium">{fullName}</span>
              <span className="text-foreground/50 text-xs">{roleName}</span>
            </div>
          </div>
        </div>
      </div>
      <Separator className="bg-foreground/10 mt-3 h-[1.5px]! rounded-full sm:mt-4.5" />
    </header>
  );
};

export default Header;
