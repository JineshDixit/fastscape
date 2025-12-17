import { Sequelize } from 'sequelize';
import dbConfig from '../config/database/dbConfig';
import { initUserModel, User } from './user.model';
import { initUserIdentityDocumentModel, UserIdentityDocument } from './userIdentityDocument.model';
import { initUserDrivingInfoModel, UserDrivingInfo } from './userDrivingInfo.model';
import { initVehicleModel, Vehicle } from './vehicle.model';
import { initVehicleMediaModel, VehicleMedia } from './vehicleMedia.model';
import { initBookingModel, Booking } from './booking.model';
import { initBookingFinancialModel, BookingFinancial } from './bookingFinancial.model';
import { initPaymentModel, Payment } from './payment.model';
import { initRefreshTokenModel, RefreshToken } from './refreshToken.model';

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
  initUserModel(sequelize);
  initUserIdentityDocumentModel(sequelize);
  initUserDrivingInfoModel(sequelize);
  initVehicleModel(sequelize);
  initVehicleMediaModel(sequelize);
  initBookingModel(sequelize);
  initBookingFinancialModel(sequelize);
  initPaymentModel(sequelize);
  initRefreshTokenModel(sequelize);

  //Associations
  User.hasOne(UserIdentityDocument, { foreignKey: 'userId' });
  User.hasOne(UserDrivingInfo, { foreignKey: 'userId' });
  User.hasMany(Booking, { foreignKey: 'userId' });
  User.hasMany(Payment, { foreignKey: 'userId' });
  User.hasMany(RefreshToken, { foreignKey: 'userId' });

  Vehicle.hasMany(VehicleMedia, { foreignKey: 'vehicleId' });
  Vehicle.hasMany(Booking, { foreignKey: 'vehicleId' });

  Booking.belongsTo(User, { foreignKey: 'userId' });
  Booking.belongsTo(Vehicle, { foreignKey: 'vehicleId' });
  Booking.hasMany(BookingFinancial, { foreignKey: 'bookingId' });
  Booking.hasMany(Payment, { foreignKey: 'bookingId' });

  Payment.belongsTo(Booking, { foreignKey: 'bookingId' });
  Payment.belongsTo(User, { foreignKey: 'userId' });

  RefreshToken.belongsTo(User, { foreignKey: 'userId' });
};

export {
  initPostgres_DB,
  sequelize,
  User,
  UserIdentityDocument,
  UserDrivingInfo,
  Vehicle,
  VehicleMedia,
  Booking,
  BookingFinancial,
  Payment,
  RefreshToken,
};
