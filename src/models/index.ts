import { Sequelize } from 'sequelize';
import dbConfig from '../config/database/dbConfig';
import logger from '../config/logger';
import { initAdminUserModel, AdminUser } from './AdminUser';
import { initRoleModel, Role } from './Role';
import { initPolicyModel, Policy } from './Policy';
import { initRolePolicyModel, RolePolicy } from './RolePolicy';
import { initAdminUserRoleModel, AdminUserRole } from './AdminUserRole';
import { initAdminRefreshTokenModel, AdminRefreshToken } from './AdminRefreshToken';
import { initVehicleModel, Vehicle } from './vehicle.model';
import { initVehicleMediaModel, VehicleMedia } from './vehicleMedia.model';
import { initUserModel, User } from './user.model';
import { initUserIdentityDocumentModel, UserIdentityDocument } from './userIdentityDocument.model';
import { initUserDrivingInfoModel, UserDrivingInfo } from './userDrivingInfo.model';
import { Booking, initBookingModel } from './booking.model';
import { initPaymentModel, Payment } from './payment.model';
import { ChauffeurReview, initChauffeurReviewModel } from './chauffeurReview.model';
import { Chauffeur, initChauffeurModel } from './chauffeur.model';
import { BookingFinancial, initBookingFinancialModel } from './bookingFinancial.model';

let sequelize: Sequelize;

/**
 * Initializes the PostgreSQL database by setting up a Sequelize
 * instance with the database configuration and defining the models
 * for the database tables.
 *
 * @returns {void} - nothing
 */
const initPostgres_DB = (): void => {
  const startTime = Date.now();
  const config = dbConfig;

  logger.info('Initializing PostgreSQL database connection', {
    host: config.POSTGRES_DB.host,
    database: config.POSTGRES_DB.database,
    port: config.POSTGRES_DB.port,
  });

  sequelize = new Sequelize(config.POSTGRES_DB.database, config.POSTGRES_DB.userName, config.POSTGRES_DB.password, {
    host: config.POSTGRES_DB.host,
    port: +config.POSTGRES_DB.port,
    dialect: 'postgres',
    logging: (sql: string) => logger.debug('SQL Query', { sql }),
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
      evict: 1000 * 60 * 10,
    },
    ssl: true,
  });
  
  logger.debug('Initializing database models');
  
  initAdminUserModel(sequelize);
  initRoleModel(sequelize);
  initPolicyModel(sequelize);
  initRolePolicyModel(sequelize);
  initAdminUserRoleModel(sequelize);
  initAdminRefreshTokenModel(sequelize);
  initVehicleModel(sequelize);
  initVehicleMediaModel(sequelize);
  initUserModel(sequelize);
  initUserIdentityDocumentModel(sequelize);
  initUserDrivingInfoModel(sequelize);
  initBookingModel(sequelize);
  initPaymentModel(sequelize);
  initChauffeurReviewModel(sequelize);
  initChauffeurModel(sequelize);
  initBookingFinancialModel(sequelize);

  logger.debug('Setting up model associations');

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
  
  // Vehicle associations
  Vehicle.hasMany(VehicleMedia, { 
    foreignKey: 'vehicleId',
    as: 'media'
  });
  
  VehicleMedia.belongsTo(Vehicle, { 
    foreignKey: 'vehicleId',
    as: 'vehicle'
  });

  User.hasOne(UserIdentityDocument, { foreignKey: 'userId' });
  User.hasOne(UserDrivingInfo, { foreignKey: 'userId' });
  User.hasMany(Booking, { foreignKey: 'userId' });
  User.hasMany(Payment, { foreignKey: 'userId' });
  User.hasMany(ChauffeurReview, { foreignKey: 'userId' });

  Vehicle.hasMany(Booking, { foreignKey: 'vehicleId' });

  Chauffeur.hasMany(Booking, { foreignKey: 'chauffeurId' });
  Chauffeur.hasMany(ChauffeurReview, { foreignKey: 'chauffeurId' });

  Booking.belongsTo(User, { foreignKey: 'userId' });
  Booking.belongsTo(Vehicle, { foreignKey: 'vehicleId' });
  Booking.belongsTo(Chauffeur, { foreignKey: 'chauffeurId' });
  Booking.hasOne(BookingFinancial, { foreignKey: 'bookingId' });
  Booking.hasMany(Payment, { foreignKey: 'bookingId' });
  Booking.hasOne(ChauffeurReview, { foreignKey: 'bookingId' });

  BookingFinancial.belongsTo(Booking, { foreignKey: 'bookingId' });

  Payment.belongsTo(Booking, { foreignKey: 'bookingId' });
  Payment.belongsTo(User, { foreignKey: 'userId' });

  ChauffeurReview.belongsTo(Booking, { foreignKey: 'bookingId' });
  ChauffeurReview.belongsTo(Chauffeur, { foreignKey: 'chauffeurId' });
  ChauffeurReview.belongsTo(User, { foreignKey: 'userId' });

  const duration = Date.now() - startTime;
  logger.info('Database initialization completed', {
    duration: `${duration}ms`,
    modelsCount: 16,
  });
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
  Vehicle,
  VehicleMedia,
  User,
  UserIdentityDocument,
  UserDrivingInfo,
  Booking,
  Payment,
  ChauffeurReview,
  Chauffeur,
  BookingFinancial
};