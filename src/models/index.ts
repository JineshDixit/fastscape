import { Sequelize } from 'sequelize';
import dbConfig from '../config/database/dbConfig';
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
import { initLocationModel, Location } from './location.model';

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

  sequelize = new Sequelize(config.POSTGRES_DB.database, config.POSTGRES_DB.userName, config.POSTGRES_DB.password, {
    host: config.POSTGRES_DB.host,
    port: +config.POSTGRES_DB.port,
    dialect: 'postgres',
    timezone: '+00:00', // Force UTC timezone for all operations
    dialectOptions: {
      timezone: 'UTC', // PostgreSQL session timezone
    },
    logging: false ,
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
  initLocationModel(sequelize)

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

  // Vehicle-Location association
  Vehicle.belongsTo(Location, {
    foreignKey: 'locationId',
    as: 'location',
  });

  Location.hasMany(Vehicle, {
    foreignKey: 'locationId',
    as: 'vehicles',
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

  // try {
  //   sequelize.sync({ alter: true });
  //   console.log('Database connection has been established successfully.');
  // } catch (error) {
  //   console.error('Unable to connect to the database:', error);
  // }
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
  BookingFinancial,
  Location
};