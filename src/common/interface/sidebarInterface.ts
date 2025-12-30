import type { ReactNode } from 'react';

export interface SidebarItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
}

export interface SidebarState {
  isCollapsed: boolean;
  isMobile: boolean;
  isOpen: boolean;
}
export interface SidebarContextType {
  isCollapsed: boolean;
  isMobile: boolean;
  isOpen: boolean;

  toggleSidebar: () => void;
  collapseSidebar: () => void;
  expandSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;

  setSidebarState: (state: Partial<SidebarState>) => void;
}

export interface SidebarProviderProps {
  children: ReactNode;
  defaultCollapsed?: boolean;
}
