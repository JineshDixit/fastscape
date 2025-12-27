import { Bell, Settings, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/context/sidebarContext";
import { useAuthContext } from "@/context/authContext";
import type { FC } from "react";
import type { HeaderProps } from "@/common/interface/headerInterface";

const Header: FC<HeaderProps> = ({ title }) => {
  const { toggleSidebar } = useSidebar();
  const { user } = useAuthContext();

  const fullName = user?.fullName || "Guest User";
  const initials = user?.firstName && user?.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() 
    : "GU";
  const roleName = user?.roles?.[0]?.name || "No Role";

  return (
    <header className="px-6 pt-4.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="m-0! pl-2! pr-0! py-2! hover:bg-transparent"
            onClick={toggleSidebar}
          >
            <PanelLeft className="h-5! w-5! text-foreground" />
          </Button>
          <Separator
            orientation="vertical"
            className="h-4.5! w-[1.5px]! rounded-full bg-foreground/20"
          ></Separator>
          <h1 className="text-xl pb-0.5 font-semibold text-foreground">{title}</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="m-0! p-2!">
              <Settings className="h-5! w-5! text-foreground" />
            </Button>

            <Button variant="ghost" className="m-0! p-2! relative">
              <Bell className="h-5! w-5! text-foreground" />
              {/* <span className="absolute top-1 right-2 h-3 w-3 bg-destructive rounded-full"/> */}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="" alt={fullName} />
              <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start text-left pb-0.5">
              <span className="text-sm font-medium text-foreground">
                {fullName}
              </span>
              <span className="text-xs text-foreground/50">{roleName}</span>
            </div>
          </div>
        </div>
      </div>
      <Separator className="h-[1.5px]! rounded-full bg-foreground/10 mt-4.5" />
    </header>
  );
};

export default Header;
