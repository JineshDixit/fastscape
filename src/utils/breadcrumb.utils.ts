import type { BreadcrumbItem } from '@/common/interface/headerInterface';

export const generateBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  // Route configurations
  const routeMap: Record<string, string> = {
    dashboard: 'Dashboard',
    bookings: 'Bookings',
    units: 'Units',
    clients: 'Clients',
    drivers: 'Drivers',
    financials: 'Financials',
    documents: 'Documents'
  };

  let currentPath = '';
  
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Handle dynamic routes
    if (segment === 'bookings' && segments[index + 1]) {
      breadcrumbs.push({
        label: routeMap[segment] || segment,
        href: currentPath
      });
      // Add booking details
      const bookingId = segments[index + 1];
      breadcrumbs.push({
        label: `Booking #${bookingId}`,
        href: `${currentPath}/${bookingId}`
      });
      return; // Skip the next iteration as we've handled it
    }
    
    if (segment === 'drivers' && segments[index + 1]) {
      breadcrumbs.push({
        label: routeMap[segment] || segment,
        href: currentPath
      });
      // Add driver details
      const driverId = segments[index + 1];
      breadcrumbs.push({
        label: `Driver #${driverId}`,
        href: `${currentPath}/${driverId}`
      });
      return; // Skip the next iteration as we've handled it
    }
    
    if (segment === 'units' && segments[index + 1]) {
      breadcrumbs.push({
        label: routeMap[segment] || segment,
        href: currentPath
      });
      // Add vehicle details
      const vehicleId = segments[index + 1];
      breadcrumbs.push({
        label: `Vehicle #${vehicleId}`,
        href: `${currentPath}/${vehicleId}`
      });
      return; // Skip the next iteration as we've handled it
    }
    
    // Skip if we've already processed this as a dynamic route
    if ((segment === 'bookings' || segment === 'units' || segment === 'drivers') && 
        (segments[index - 1] === 'bookings' || segments[index - 1] === 'units' || segments[index - 1] === 'drivers')) {
      return;
    }
    
    // Add regular route
    if (routeMap[segment]) {
      breadcrumbs.push({
        label: routeMap[segment],
        href: currentPath
      });
    }
  });

  return breadcrumbs;
};
