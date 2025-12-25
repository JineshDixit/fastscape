# Admin Backend Seeders

This directory contains database seeder scripts to populate the admin backend with initial data.

## Available Seeders

### Admin Seeder (`adminSeeder.ts`)

Creates comprehensive admin system data including:

- **Policies**: Permission sets for different access levels
- **Roles**: User roles with associated policies
- **Admin Users**: Dummy admin users with different roles
- **Role-Policy Mappings**: Associations between roles and policies
- **Admin User-Role Mappings**: Role assignments for admin users

## Running Seeders

### Run All Seeders
```bash
npm run seed
# or
npm run seed:admin
```

### Run Individual Seeder (if needed)
```bash
npx ts-node src/seeders/adminSeeder.ts
```

## Created Admin Users

The seeder creates the following admin users for testing:

| Email | Password | Role | Permissions |
|-------|----------|------|-------------|
| `superadmin@fastscape.com` | `SuperAdmin123!` | super-admin | Full system access |
| `admin@fastscape.com` | `Admin123!` | admin | Standard admin permissions |
| `moderator@fastscape.com` | `Moderator123!` | moderator | Content moderation |
| `support@fastscape.com` | `Support123!` | support | Read-only support access |

## Roles and Permissions

### Super Admin
- **Role**: `super-admin`
- **Policy**: `super-admin-policy`
- **Permissions**: All system permissions including:
  - Full user management
  - Role and policy management
  - System settings and maintenance
  - Analytics and reporting
  - Content management

### Admin
- **Role**: `admin`
- **Policy**: `admin-policy`
- **Permissions**: Standard admin permissions including:
  - Limited user management (read, update, deactivate)
  - Read-only role and policy access
  - Content management
  - Analytics and reporting

### Moderator
- **Role**: `moderator`
- **Policy**: `moderator-policy`
- **Permissions**: Content moderation permissions including:
  - Basic user management (read, deactivate)
  - Content moderation and management
  - Basic analytics access

### Support
- **Role**: `support`
- **Policy**: `support-policy`
- **Permissions**: Support-specific permissions including:
  - Read-only user access
  - Read-only content access
  - Support ticket management
  - Basic analytics access

## Permission Naming Convention

Permissions follow a hierarchical naming pattern:
```
admin.{resource}.{action}

Examples:
- admin.users.create
- admin.users.read
- admin.users.update
- admin.users.delete
- admin.roles.manage
- admin.content.moderate
```

## Testing Authentication

After running the seeder, you can test authentication with any of the created users:

### Login Request
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@fastscape.com",
    "password": "SuperAdmin123!"
  }'
```

### Using the Token
```bash
curl -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Re-running Seeders

The seeder is designed to be idempotent:
- **Policies**: Updates existing policies with new permissions
- **Roles**: Updates existing roles with new descriptions
- **Users**: Skips existing users (won't overwrite)
- **Mappings**: Skips existing role-policy and user-role mappings

This means you can safely re-run the seeder to update permissions without duplicating data.

## Environment Requirements

Make sure your environment variables are properly configured:
- Database connection settings
- JWT secrets
- Other required environment variables

The seeder will use the same database configuration as your main application.

## Troubleshooting

### Database Connection Issues
- Ensure your database is running
- Check your environment variables
- Verify database credentials

### Permission Errors
- Make sure the database user has CREATE, INSERT, UPDATE permissions
- Check if tables exist (run migrations if needed)

### Seeder Fails Partially
The seeder runs in order:
1. Policies
2. Roles  
3. Role-Policy mappings
4. Admin users
5. User-Role mappings

If it fails at any step, you can re-run it safely as it checks for existing data.