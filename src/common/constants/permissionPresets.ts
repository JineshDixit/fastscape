export interface PermissionPresetGroup {
  key: string;
  label: string;
  permissions: string[];
}

export const PERMISSION_PRESET_GROUPS: PermissionPresetGroup[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    permissions: ['dashboard:view'],
  },
  {
    key: 'bookings',
    label: 'Bookings',
    permissions: [
      'booking:read',
      'booking:list',
      'booking:view',
      'booking:create',
      'booking:update',
      'booking:delete',
      'booking:export',
    ],
  },
  {
    key: 'vehicles',
    label: 'Vehicles',
    permissions: [
      'vehicle:read',
      'vehicle:list',
      'vehicle:view',
      'vehicle:create',
      'vehicle:update',
      'vehicle:write',
      'vehicle:delete',
      'vehicle:stats',
      'vehicle:export',
    ],
  },
  {
    key: 'chauffeurs',
    label: 'Chauffeurs',
    permissions: [
      'chauffeur:read',
      'chauffeur:list',
      'chauffeur:view',
      'chauffeur:create',
      'chauffeur:update',
      'chauffeur:write',
      'chauffeur:delete',
      'chauffeur:verify',
      'chauffeur:export',
    ],
  },
  {
    key: 'clients',
    label: 'Clients',
    permissions: [
      'user:read',
      'user:list',
      'user:view',
      'user:create',
      'user:update',
      'user:write',
      'user:delete',
      'user:export',
    ],
  },
  {
    key: 'locations',
    label: 'Locations',
    permissions: [
      'location:read',
      'location:list',
      'location:view',
      'location:create',
      'location:update',
      'location:write',
      'location:delete',
      'location:export',
    ],
  },
  {
    key: 'financials',
    label: 'Financials',
    permissions: [
      'finance:read',
      'finance:list',
      'finance:view',
      'finance:create',
      'finance:update',
      'finance:delete',
      'finance:export',
      'finance:generate-invoice',
    ],
  },
  {
    key: 'documents',
    label: 'Documents',
    permissions: [
      'document:read',
      'document:list',
      'document:view',
      'document:create',
      'document:update',
      'document:delete',
      'document:download',
    ],
  },
  {
    key: 'admin-users',
    label: 'Admin Users',
    permissions: [
      'admin.users.create',
      'admin.users.read',
      'admin.users.update',
      'admin.users.delete',
      'admin.users.activate',
      'admin.users.deactivate',
      'admin.users.manage',
    ],
  },
  {
    key: 'admin-roles',
    label: 'Admin Roles',
    permissions: [
      'admin.roles.create',
      'admin.roles.read',
      'admin.roles.update',
      'admin.roles.delete',
      'admin.roles.activate',
      'admin.roles.deactivate',
      'admin.roles.manage',
    ],
  },
  {
    key: 'admin-policies',
    label: 'Admin Policies',
    permissions: [
      'admin.policies.create',
      'admin.policies.read',
      'admin.policies.update',
      'admin.policies.delete',
      'admin.policies.activate',
      'admin.policies.deactivate',
      'admin.policies.manage',
    ],
  },
  {
    key: 'admin-content',
    label: 'Admin Content',
    permissions: [
      'admin.content.create',
      'admin.content.read',
      'admin.content.update',
      'admin.content.delete',
      'admin.content.moderate',
    ],
  },
  {
    key: 'admin-ops',
    label: 'Admin System & Reports',
    permissions: [
      'admin.system.settings',
      'admin.system.logs',
      'admin.system.maintenance',
      'admin.system.backup',
      'admin.analytics.read',
      'admin.reports.generate',
      'admin.reports.export',
    ],
  },
  {
    key: 'super-access',
    label: 'Super Access',
    permissions: ['admin:all'],
  },
];

export const ALL_PERMISSION_PRESETS: string[] = Array.from(
  new Set(PERMISSION_PRESET_GROUPS.flatMap((group) => group.permissions)),
);
