import { AdminUser, Policy, Role } from '../../models';

export interface RoleWithAdminUsers extends Role {
  AdminUsers?: AdminUser[];
}

export interface AdminUserWithAssociations extends AdminUser {
  Roles?: (Role & {
    Policies?: Policy[];
  })[];
}
