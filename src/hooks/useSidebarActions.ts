import { useSidebar } from '@/context/sidebarContext';

/**
 * Custom hook that provides common sidebar actions and utilities
 */
export const useSidebarActions = () => {
  const {
    isCollapsed,
    isMobile,
    isOpen,
    toggleSidebar,
    collapseSidebar,
    expandSidebar,
    openSidebar,
    closeSidebar
  } = useSidebar();

  // Utility functions
  const handleMobileToggle = () => {
    if (isMobile) {
      isOpen ? closeSidebar() : openSidebar();
    } else {
      toggleSidebar();
    }
  };

  const handleDesktopToggle = () => {
    if (!isMobile) {
      toggleSidebar();
    }
  };

  const forceClose = () => {
    if (isMobile) {
      closeSidebar();
    } else {
      collapseSidebar();
    }
  };

  const forceOpen = () => {
    if (isMobile) {
      openSidebar();
    } else {
      expandSidebar();
    }
  };

  // State helpers
  const isVisible = isMobile ? isOpen : true;
  const isFullWidth = !isCollapsed || isMobile;
  const showOverlay = isMobile && isOpen;

  return {
    // State
    isCollapsed,
    isMobile,
    isOpen,
    isVisible,
    isFullWidth,
    showOverlay,
    
    // Actions
    toggle: handleMobileToggle,
    toggleDesktop: handleDesktopToggle,
    collapse: collapseSidebar,
    expand: expandSidebar,
    open: openSidebar,
    close: closeSidebar,
    forceClose,
    forceOpen,
    
    // Original actions
    toggleSidebar,
    collapseSidebar,
    expandSidebar,
    openSidebar,
    closeSidebar
  };
};