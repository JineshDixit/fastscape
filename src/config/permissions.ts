/**
 * Permission Configuration
 * Centralized permission definitions for role-based access control
 */

export const PERMISSIONS = {
  // Dashboard
  DASHBOARD: {
    VIEW: 'dashboard:view',
  },

  // Bookings
  BOOKINGS: {
    READ: 'booking:read',
    LIST: 'booking:list',
    VIEW: 'booking:view',
    CREATE: 'booking:create',
    UPDATE: 'booking:update',
    DELETE: 'booking:delete',
    EXPORT: 'booking:export',
  },

  // Vehicles/Units
  VEHICLES: {
    READ: 'vehicle:read',
    LIST: 'vehicle:list',
    VIEW: 'vehicle:view',
    CREATE: 'vehicle:create',
    UPDATE: 'vehicle:update',
    WRITE: 'vehicle:write',
    DELETE: 'vehicle:delete',
    STATS: 'vehicle:stats',
    EXPORT: 'vehicle:export',
  },

  // Chauffeurs/Drivers
  CHAUFFEURS: {
    READ: 'chauffeur:read',
    LIST: 'chauffeur:list',
    VIEW: 'chauffeur:view',
    CREATE: 'chauffeur:create',
    UPDATE: 'chauffeur:update',
    WRITE: 'chauffeur:write',
    DELETE: 'chauffeur:delete',
    VERIFY: 'chauffeur:verify',
    EXPORT: 'chauffeur:export',
  },

  // Clients/Users
  CLIENTS: {
    READ: 'user:read',
    LIST: 'user:list',
    VIEW: 'user:view',
    CREATE: 'user:create',
    UPDATE: 'user:update',
    WRITE: 'user:write',
    DELETE: 'user:delete',
    EXPORT: 'user:export',
  },

  // Locations
  LOCATIONS: {
    READ: 'location:read',
    LIST: 'location:list',
    VIEW: 'location:view',
    CREATE: 'location:create',
    UPDATE: 'location:update',
    WRITE: 'location:write',
    DELETE: 'location:delete',
    EXPORT: 'location:export',
  },

  // Financials
  FINANCIALS: {
    READ: 'finance:read',
    LIST: 'finance:list',
    VIEW: 'finance:view',
    CREATE: 'finance:create',
    UPDATE: 'finance:update',
    DELETE: 'finance:delete',
    EXPORT: 'finance:export',
    GENERATE_INVOICE: 'finance:generate-invoice',
  },

  // Documents
  DOCUMENTS: {
    READ: 'document:read',
    LIST: 'document:list',
    VIEW: 'document:view',
    CREATE: 'document:create',
    UPDATE: 'document:update',
    DELETE: 'document:delete',
    DOWNLOAD: 'document:download',
  },

  // Admin Management
  ADMIN: {
    USERS: {
      READ: 'admin.users.read',
      CREATE: 'admin.users.create',
      UPDATE: 'admin.users.update',
      DELETE: 'admin.users.delete',
      ACTIVATE: 'admin.users.activate',
      DEACTIVATE: 'admin.users.deactivate',
    },
    ROLES: {
      READ: 'admin.roles.read',
      CREATE: 'admin.roles.create',
      UPDATE: 'admin.roles.update',
      DELETE: 'admin.roles.delete',
      ACTIVATE: 'admin.roles.activate',
      DEACTIVATE: 'admin.roles.deactivate',
    },
    POLICIES: {
      READ: 'admin.policies.read',
      CREATE: 'admin.policies.create',
      UPDATE: 'admin.policies.update',
      DELETE: 'admin.policies.delete',
      ACTIVATE: 'admin.policies.activate',
      DEACTIVATE: 'admin.policies.deactivate',
    },
    CONTENT: {
      READ: 'admin.content.read',
      CREATE: 'admin.content.create',
      UPDATE: 'admin.content.update',
      DELETE: 'admin.content.delete',
    },
  },

  // Super Admin - has all permissions
  SUPER_ADMIN: 'admin:all',
} as const;

/**
 * Route Permission Mappings
 * Maps routes to required permissions
 */
export const ROUTE_PERMISSIONS = {
  '/dashboard': [],
  '/bookings': [PERMISSIONS.BOOKINGS.LIST, PERMISSIONS.BOOKINGS.READ],
  '/bookings/:id': [PERMISSIONS.BOOKINGS.VIEW, PERMISSIONS.BOOKINGS.READ],
  '/units': [PERMISSIONS.VEHICLES.LIST, PERMISSIONS.VEHICLES.READ],
  '/units/:id': [PERMISSIONS.VEHICLES.VIEW, PERMISSIONS.VEHICLES.READ],
  '/drivers': [PERMISSIONS.CHAUFFEURS.LIST, PERMISSIONS.CHAUFFEURS.READ],
  '/drivers/:id': [PERMISSIONS.CHAUFFEURS.VIEW, PERMISSIONS.CHAUFFEURS.READ],
  '/clients': [PERMISSIONS.CLIENTS.LIST, PERMISSIONS.CLIENTS.READ],
  '/clients/:id': [PERMISSIONS.CLIENTS.VIEW, PERMISSIONS.CLIENTS.READ],
  '/locations': [PERMISSIONS.LOCATIONS.LIST, PERMISSIONS.LOCATIONS.READ],
  '/financials': [PERMISSIONS.FINANCIALS.LIST, PERMISSIONS.FINANCIALS.READ, PERMISSIONS.ADMIN.CONTENT.READ],
  '/financials/:id': [PERMISSIONS.FINANCIALS.VIEW, PERMISSIONS.FINANCIALS.READ, PERMISSIONS.ADMIN.CONTENT.READ],
  '/documents': [PERMISSIONS.DOCUMENTS.LIST, PERMISSIONS.DOCUMENTS.READ],
  '/admin-management': [PERMISSIONS.ADMIN.USERS.READ],
} as const;

/**
 * Action Permission Mappings
 * Maps CRUD actions to required permissions for each module
 */
export const ACTION_PERMISSIONS = {
  bookings: {
    create: [PERMISSIONS.BOOKINGS.CREATE],
    read: [PERMISSIONS.BOOKINGS.READ, PERMISSIONS.BOOKINGS.LIST],
    update: [PERMISSIONS.BOOKINGS.UPDATE],
    delete: [PERMISSIONS.BOOKINGS.DELETE],
    export: [PERMISSIONS.BOOKINGS.EXPORT, PERMISSIONS.BOOKINGS.READ],
  },
  vehicles: {
    create: [PERMISSIONS.VEHICLES.CREATE, PERMISSIONS.VEHICLES.WRITE],
    read: [PERMISSIONS.VEHICLES.READ, PERMISSIONS.VEHICLES.LIST],
    update: [PERMISSIONS.VEHICLES.UPDATE, PERMISSIONS.VEHICLES.WRITE],
    delete: [PERMISSIONS.VEHICLES.DELETE],
    export: [PERMISSIONS.VEHICLES.EXPORT, PERMISSIONS.VEHICLES.READ],
  },
  chauffeurs: {
    create: [PERMISSIONS.CHAUFFEURS.CREATE, PERMISSIONS.CHAUFFEURS.WRITE],
    read: [PERMISSIONS.CHAUFFEURS.READ, PERMISSIONS.CHAUFFEURS.LIST],
    update: [PERMISSIONS.CHAUFFEURS.UPDATE, PERMISSIONS.CHAUFFEURS.WRITE],
    delete: [PERMISSIONS.CHAUFFEURS.DELETE],
    verify: [PERMISSIONS.CHAUFFEURS.VERIFY],
    export: [PERMISSIONS.CHAUFFEURS.EXPORT, PERMISSIONS.CHAUFFEURS.READ],
  },
  clients: {
    create: [PERMISSIONS.CLIENTS.CREATE, PERMISSIONS.CLIENTS.WRITE],
    read: [PERMISSIONS.CLIENTS.READ, PERMISSIONS.CLIENTS.LIST],
    update: [PERMISSIONS.CLIENTS.UPDATE, PERMISSIONS.CLIENTS.WRITE],
    delete: [PERMISSIONS.CLIENTS.DELETE],
    export: [PERMISSIONS.CLIENTS.EXPORT, PERMISSIONS.CLIENTS.READ],
  },
  locations: {
    create: [PERMISSIONS.LOCATIONS.CREATE, PERMISSIONS.LOCATIONS.WRITE],
    read: [PERMISSIONS.LOCATIONS.READ, PERMISSIONS.LOCATIONS.LIST],
    update: [PERMISSIONS.LOCATIONS.UPDATE, PERMISSIONS.LOCATIONS.WRITE],
    delete: [PERMISSIONS.LOCATIONS.DELETE],
    export: [PERMISSIONS.LOCATIONS.EXPORT, PERMISSIONS.LOCATIONS.READ],
  },
  financials: {
    create: [PERMISSIONS.FINANCIALS.CREATE],
    read: [PERMISSIONS.FINANCIALS.READ, PERMISSIONS.FINANCIALS.LIST, PERMISSIONS.ADMIN.CONTENT.READ],
    update: [PERMISSIONS.FINANCIALS.UPDATE],
    delete: [PERMISSIONS.FINANCIALS.DELETE],
    export: [PERMISSIONS.FINANCIALS.EXPORT, PERMISSIONS.FINANCIALS.READ],
    generateInvoice: [PERMISSIONS.FINANCIALS.GENERATE_INVOICE],
  },
  documents: {
    create: [PERMISSIONS.DOCUMENTS.CREATE],
    read: [PERMISSIONS.DOCUMENTS.READ, PERMISSIONS.DOCUMENTS.LIST],
    update: [PERMISSIONS.DOCUMENTS.UPDATE],
    delete: [PERMISSIONS.DOCUMENTS.DELETE],
    download: [PERMISSIONS.DOCUMENTS.DOWNLOAD, PERMISSIONS.DOCUMENTS.READ],
  },
  admin: {
    users: {
      create: [PERMISSIONS.ADMIN.USERS.CREATE],
      read: [PERMISSIONS.ADMIN.USERS.READ],
      update: [PERMISSIONS.ADMIN.USERS.UPDATE],
      delete: [PERMISSIONS.ADMIN.USERS.DELETE],
      activate: [PERMISSIONS.ADMIN.USERS.ACTIVATE],
      deactivate: [PERMISSIONS.ADMIN.USERS.DEACTIVATE],
    },
    roles: {
      create: [PERMISSIONS.ADMIN.ROLES.CREATE],
      read: [PERMISSIONS.ADMIN.ROLES.READ],
      update: [PERMISSIONS.ADMIN.ROLES.UPDATE],
      delete: [PERMISSIONS.ADMIN.ROLES.DELETE],
    },
    policies: {
      create: [PERMISSIONS.ADMIN.POLICIES.CREATE],
      read: [PERMISSIONS.ADMIN.POLICIES.READ],
      update: [PERMISSIONS.ADMIN.POLICIES.UPDATE],
      delete: [PERMISSIONS.ADMIN.POLICIES.DELETE],
    },
  },
} as const;
