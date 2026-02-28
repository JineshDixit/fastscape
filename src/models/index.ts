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
import { initChauffeurModel, Chauffeur } from './chauffeur.model';
import { initChauffeurReviewModel, ChauffeurReview } from './chauffeurReview.model';
import { initLocationModel, Location } from './location.model';
import { initWebhookEventModel, WebhookEvent } from './webhookEvent.model';

let sequelize: Sequelize;

/**
 * Initializes the PostgreSQL database by setting up a Sequelize
 * instance with the database configuration and defining the models
 * for the database tables.
 *
 * @returns {void} - nothing
 */
const initPostgres_DB = async (): Promise<void> => {
  const config = dbConfig;

  sequelize = new Sequelize(config.POSTGRES_DB.database, config.POSTGRES_DB.userName, config.POSTGRES_DB.password, {
    host: config.POSTGRES_DB.host,
    port: +config.POSTGRES_DB.port,
    dialect: 'postgres',
    timezone: '+00:00', // Force UTC timezone for all operations
    dialectOptions: {
      timezone: 'UTC', // PostgreSQL session timezone
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 60000,
      idle: 10000,
      evict: 1000 * 60 * 10,
    },
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
  initChauffeurModel(sequelize);
  initChauffeurReviewModel(sequelize);
  initLocationModel(sequelize);
  initWebhookEventModel(sequelize);

  //Associations
  User.hasOne(UserIdentityDocument, { foreignKey: 'userId', as: 'identityDocument' });
  User.hasOne(UserDrivingInfo, { foreignKey: 'userId', as: 'drivingInfo' });
  User.hasMany(Booking, { foreignKey: 'userId', as: 'bookings' });
  User.hasMany(Payment, { foreignKey: 'userId', as: 'payments' });
  User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });
  User.hasMany(ChauffeurReview, { foreignKey: 'userId', as: 'reviews' });

  UserIdentityDocument.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  UserDrivingInfo.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  Vehicle.hasMany(VehicleMedia, { foreignKey: 'vehicleId', as: 'media' });
  Vehicle.hasMany(Booking, { foreignKey: 'vehicleId', as: 'bookings' });
  VehicleMedia.belongsTo(Vehicle, {
    foreignKey: 'vehicleId',
    as: 'vehicle',
  });

  Vehicle.belongsTo(Location, {
    foreignKey: 'locationId',
    as: 'location',
  });

  Location.hasMany(Vehicle, {
    foreignKey: 'locationId',
    as: 'vehicles',
  });

  Chauffeur.hasMany(Booking, { foreignKey: 'chauffeurId', as: 'bookings' });
  Chauffeur.hasMany(ChauffeurReview, { foreignKey: 'chauffeurId', as: 'reviews' });

  Booking.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  Booking.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });
  Booking.belongsTo(Chauffeur, { foreignKey: 'chauffeurId', as: 'chauffeur' });
  Booking.hasOne(BookingFinancial, { foreignKey: 'bookingId', as: 'financial' });
  Booking.hasMany(Payment, { foreignKey: 'bookingId', as: 'payments' });
  Booking.hasOne(ChauffeurReview, { foreignKey: 'bookingId', as: 'review' });

  BookingFinancial.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });

  Payment.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });
  Payment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  ChauffeurReview.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });
  ChauffeurReview.belongsTo(Chauffeur, { foreignKey: 'chauffeurId', as: 'chauffeur' });
  ChauffeurReview.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });
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
  Chauffeur,
  ChauffeurReview,
  Location,
  WebhookEvent,
};
