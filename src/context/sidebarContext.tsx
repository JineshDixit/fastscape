import { SIDE_BAR } from '@/common/constant/context';
import type { SidebarContextType, SidebarProviderProps, SidebarState } from '@/common/interface/sidebarInterface';
import React, { createContext, useContext, useState, useEffect } from 'react';

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider: React.FC<SidebarProviderProps> = ({ 
  children, 
  defaultCollapsed = false 
}) => {
  const [sidebarState, setSidebarStateInternal] = useState<SidebarState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(SIDE_BAR.SIDEBAR_STORAGE_KEY);
      return {
        isCollapsed: saved ? JSON.parse(saved) : defaultCollapsed,
        isMobile: window.innerWidth < 980,
        isOpen: false
      };
    }
    
    return {
      isCollapsed: defaultCollapsed,
      isMobile: false,
      isOpen: false
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 980;
      setSidebarStateInternal(prev => ({
        ...prev,
        isMobile,
        isOpen: isMobile ? prev.isOpen : false
      }));
    };

    window.addEventListener('resize', handleResize);
    
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SIDE_BAR.SIDEBAR_STORAGE_KEY, JSON.stringify(sidebarState.isCollapsed));
    }
  }, [sidebarState.isCollapsed]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarState.isMobile && sidebarState.isOpen) {
        closeSidebar();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [sidebarState.isMobile, sidebarState.isOpen]);

  const toggleSidebar = () => {
    setSidebarStateInternal(prev => ({
      ...prev,
      isCollapsed: prev.isMobile ? prev.isCollapsed : !prev.isCollapsed,
      isOpen: prev.isMobile ? !prev.isOpen : prev.isOpen
    }));
  };

  const collapseSidebar = () => {
    setSidebarStateInternal(prev => ({
      ...prev,
      isCollapsed: true
    }));
  };

  const expandSidebar = () => {
    setSidebarStateInternal(prev => ({
      ...prev,
      isCollapsed: false
    }));
  };

  const openSidebar = () => {
    setSidebarStateInternal(prev => ({
      ...prev,
      isOpen: true
    }));
  };

  const closeSidebar = () => {
    setSidebarStateInternal(prev => ({
      ...prev,
      isOpen: false
    }));
  };

  const setSidebarState = (newState: Partial<SidebarState>) => {
    setSidebarStateInternal(prev => ({
      ...prev,
      ...newState
    }));
  };

  const contextValue: SidebarContextType = {
    isCollapsed: sidebarState.isCollapsed,
    isMobile: sidebarState.isMobile,
    isOpen: sidebarState.isOpen,
    
    toggleSidebar,
    collapseSidebar,
    expandSidebar,
    openSidebar,
    closeSidebar,
    
    setSidebarState
  };

  return (
    <SidebarContext.Provider value={contextValue}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = (): SidebarContextType => {
  const context = useContext(SidebarContext);
  
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  
  return context;
};

export const withSidebar = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const WrappedComponent = (props: P) => (
    <SidebarProvider>
      <Component {...props} />
    </SidebarProvider>
  );
  
  WrappedComponent.displayName = `withSidebar(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export const useSidebarClasses = () => {
  const { isCollapsed, isMobile, isOpen } = useSidebar();
  
  return {
    sidebarClasses: `
      ${isCollapsed && !isMobile ? 'w-16' : 'w-64'}
      ${isMobile ? 'fixed inset-y-0 left-0 z-50' : 'relative'}
      ${isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0'}
      transition-all duration-300 ease-in-out
    `.trim(),
    
    contentClasses: `
      ${!isMobile && isCollapsed ? 'ml-16' : !isMobile ? 'ml-64' : 'ml-0'}
      transition-all duration-300 ease-in-out
    `.trim(),
    
    overlayClasses: `
      ${isMobile && isOpen ? 'fixed inset-0 bg-black bg-opacity-50 z-40' : 'hidden'}
      transition-opacity duration-300 ease-in-out
    `.trim(),
    
    toggleClasses: `
      ${isMobile ? 'md:hidden' : ''}
    `.trim()
  };
};

export default SidebarContext;