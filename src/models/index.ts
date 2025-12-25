import { Sequelize } from 'sequelize';
import dbConfig from '../config/database/dbConfig';
import { initAdminUserModel, AdminUser } from './AdminUser';
import { initRoleModel, Role } from './Role';
import { initPolicyModel, Policy } from './Policy';
import { initRolePolicyModel, RolePolicy } from './RolePolicy';
import { initAdminUserRoleModel, AdminUserRole } from './AdminUserRole';
import { initAdminRefreshTokenModel, AdminRefreshToken } from './AdminRefreshToken';

let sequelize: Sequelize;

/**
 * Initializes the PostgreSQL database by setting up a Sequelize
 * instance with the database configuration and defining the models
 * for the database tables.
 *
 * @returns {void} - nothing
 */
const initPostgres_DB = (): void => {
  const config = dbConfig;

  sequelize = new Sequelize(config.POSTGRES_DB.database, config.POSTGRES_DB.userName, config.POSTGRES_DB.password, {
    host: config.POSTGRES_DB.host,
    port: +config.POSTGRES_DB.port,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
      evict: 1000 * 60 * 10,
    },
    ssl: true,
  });
  
  initAdminUserModel(sequelize);
  initRoleModel(sequelize);
  initPolicyModel(sequelize);
  initRolePolicyModel(sequelize);
  initAdminUserRoleModel(sequelize);
  initAdminRefreshTokenModel(sequelize);

  // Associations
  AdminUser.belongsToMany(Role, { 
    through: AdminUserRole, 
    foreignKey: 'adminUserId',
    otherKey: 'roleId'
  });
  
  Role.belongsToMany(AdminUser, { 
    through: AdminUserRole, 
    foreignKey: 'roleId',
    otherKey: 'adminUserId'
  });
  
  Role.belongsToMany(Policy, { 
    through: RolePolicy, 
    foreignKey: 'roleId',
    otherKey: 'policyId'
  });
  
  Policy.belongsToMany(Role, { 
    through: RolePolicy, 
    foreignKey: 'policyId',
    otherKey: 'roleId'
  });
  
  AdminUser.hasMany(AdminRefreshToken, { 
    foreignKey: 'adminUserId'
  });
  
  AdminRefreshToken.belongsTo(AdminUser, { 
    foreignKey: 'adminUserId'
  });

  // Junction table associations
  AdminUserRole.belongsTo(AdminUser, { foreignKey: 'adminUserId' });
  AdminUserRole.belongsTo(Role, { foreignKey: 'roleId' });
  AdminUserRole.belongsTo(AdminUser, { foreignKey: 'assignedBy', as: 'AssignedByUser' });
  
  RolePolicy.belongsTo(Role, { foreignKey: 'roleId' });
  RolePolicy.belongsTo(Policy, { foreignKey: 'policyId' });
};

export {
  initPostgres_DB,
  sequelize,
  AdminUser,
  Role,
  Policy,
  RolePolicy,
  AdminUserRole,
  AdminRefreshToken,
};