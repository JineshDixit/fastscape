import type { BreadcrumbItem } from '@/common/interface/headerInterface';

export const generateBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  // Route configurations
  const routeMap: Record<string, string> = {
    dashboard: 'Dashboard',
    profile: 'User Profile',
    bookings: 'Bookings',
    units: 'Units',
    clients: 'Clients',
    drivers: 'Drivers',
    financials: 'Financials',
    documents: 'Documents',
    locations: 'Locations',
    'legal-content': 'Legal Content',
    'admin-management': 'Admin Management',
  };

  let currentPath = '';

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;

    // Handle dynamic routes
    if (segment === 'bookings' && segments[index + 1]) {
      breadcrumbs.push({
        label: routeMap[segment] || segment,
        href: currentPath,
      });
      // Add booking details
      const bookingId = segments[index + 1];
      breadcrumbs.push({
        label: `Booking #${bookingId}`,
        href: `${currentPath}/${bookingId}`,
      });
      return; // Skip the next iteration as we've handled it
    }

    if (segment === 'drivers' && segments[index + 1]) {
      breadcrumbs.push({
        label: routeMap[segment] || segment,
        href: currentPath,
      });
      // Add driver details
      const driverId = segments[index + 1];
      breadcrumbs.push({
        label: `Driver #${driverId}`,
        href: `${currentPath}/${driverId}`,
      });
      return; // Skip the next iteration as we've handled it
    }

    if (segment === 'clients' && segments[index + 1]) {
      breadcrumbs.push({
        label: routeMap[segment] || segment,
        href: currentPath,
      });
      // Add client details
      const clientId = segments[index + 1];
      breadcrumbs.push({
        label: `Client #${clientId}`,
        href: `${currentPath}/${clientId}`,
      });
      return; // Skip the next iteration as we've handled it
    }

    if (segment === 'units' && segments[index + 1]) {
      breadcrumbs.push({
        label: routeMap[segment] || segment,
        href: currentPath,
      });
      // Add vehicle details
      const vehicleId = segments[index + 1];
      breadcrumbs.push({
        label: `Vehicle #${vehicleId}`,
        href: `${currentPath}/${vehicleId}`,
      });
      return; // Skip the next iteration as we've handled it
    }

    if (segment === 'financials' && segments[index + 1]) {
      breadcrumbs.push({
        label: routeMap[segment] || segment,
        href: currentPath,
      });
      // Add finance details
      const financeId = segments[index + 1];
      breadcrumbs.push({
        label: `Finance Details #${financeId}`,
        href: `${currentPath}/${financeId}`,
      });
      return; // Skip the next iteration as we've handled it
    }

    // Skip if we've already processed this as a dynamic route
    if (
      (segment === 'bookings' ||
        segment === 'units' ||
        segment === 'drivers' ||
        segment === 'clients' ||
        segment === 'financials') &&
      (segments[index - 1] === 'bookings' ||
        segments[index - 1] === 'units' ||
        segments[index - 1] === 'drivers' ||
        segments[index - 1] === 'clients' ||
        segments[index - 1] === 'financials')
    ) {
      return;
    }

    // Add regular route
    if (routeMap[segment]) {
      breadcrumbs.push({
        label: routeMap[segment],
        href: currentPath,
      });
    }
  });

  return breadcrumbs;
};
