"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookEvent = exports.Location = exports.ChauffeurReview = exports.Chauffeur = exports.RefreshToken = exports.Payment = exports.BookingFinancial = exports.Booking = exports.VehicleMedia = exports.Vehicle = exports.UserDrivingInfo = exports.UserIdentityDocument = exports.User = exports.sequelize = exports.initPostgres_DB = void 0;
const sequelize_1 = require("sequelize");
const dbConfig_1 = __importDefault(require("../config/database/dbConfig"));
const user_model_1 = require("./user.model");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return user_model_1.User; } });
const userIdentityDocument_model_1 = require("./userIdentityDocument.model");
Object.defineProperty(exports, "UserIdentityDocument", { enumerable: true, get: function () { return userIdentityDocument_model_1.UserIdentityDocument; } });
const userDrivingInfo_model_1 = require("./userDrivingInfo.model");
Object.defineProperty(exports, "UserDrivingInfo", { enumerable: true, get: function () { return userDrivingInfo_model_1.UserDrivingInfo; } });
const vehicle_model_1 = require("./vehicle.model");
Object.defineProperty(exports, "Vehicle", { enumerable: true, get: function () { return vehicle_model_1.Vehicle; } });
const vehicleMedia_model_1 = require("./vehicleMedia.model");
Object.defineProperty(exports, "VehicleMedia", { enumerable: true, get: function () { return vehicleMedia_model_1.VehicleMedia; } });
const booking_model_1 = require("./booking.model");
Object.defineProperty(exports, "Booking", { enumerable: true, get: function () { return booking_model_1.Booking; } });
const bookingFinancial_model_1 = require("./bookingFinancial.model");
Object.defineProperty(exports, "BookingFinancial", { enumerable: true, get: function () { return bookingFinancial_model_1.BookingFinancial; } });
const payment_model_1 = require("./payment.model");
Object.defineProperty(exports, "Payment", { enumerable: true, get: function () { return payment_model_1.Payment; } });
const refreshToken_model_1 = require("./refreshToken.model");
Object.defineProperty(exports, "RefreshToken", { enumerable: true, get: function () { return refreshToken_model_1.RefreshToken; } });
const chauffeur_model_1 = require("./chauffeur.model");
Object.defineProperty(exports, "Chauffeur", { enumerable: true, get: function () { return chauffeur_model_1.Chauffeur; } });
const chauffeurReview_model_1 = require("./chauffeurReview.model");
Object.defineProperty(exports, "ChauffeurReview", { enumerable: true, get: function () { return chauffeurReview_model_1.ChauffeurReview; } });
const location_model_1 = require("./location.model");
Object.defineProperty(exports, "Location", { enumerable: true, get: function () { return location_model_1.Location; } });
const webhookEvent_model_1 = require("./webhookEvent.model");
Object.defineProperty(exports, "WebhookEvent", { enumerable: true, get: function () { return webhookEvent_model_1.WebhookEvent; } });
let sequelize;
/**
 * Initializes the PostgreSQL database by setting up a Sequelize
 * instance with the database configuration and defining the models
 * for the database tables.
 *
 * @returns {void} - nothing
 */
const initPostgres_DB = () => __awaiter(void 0, void 0, void 0, function* () {
    const config = dbConfig_1.default;
    exports.sequelize = sequelize = new sequelize_1.Sequelize(config.POSTGRES_DB.database, config.POSTGRES_DB.userName, config.POSTGRES_DB.password, {
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
    (0, user_model_1.initUserModel)(sequelize);
    (0, userIdentityDocument_model_1.initUserIdentityDocumentModel)(sequelize);
    (0, userDrivingInfo_model_1.initUserDrivingInfoModel)(sequelize);
    (0, vehicle_model_1.initVehicleModel)(sequelize);
    (0, vehicleMedia_model_1.initVehicleMediaModel)(sequelize);
    (0, booking_model_1.initBookingModel)(sequelize);
    (0, bookingFinancial_model_1.initBookingFinancialModel)(sequelize);
    (0, payment_model_1.initPaymentModel)(sequelize);
    (0, refreshToken_model_1.initRefreshTokenModel)(sequelize);
    (0, chauffeur_model_1.initChauffeurModel)(sequelize);
    (0, chauffeurReview_model_1.initChauffeurReviewModel)(sequelize);
    (0, location_model_1.initLocationModel)(sequelize);
    (0, webhookEvent_model_1.initWebhookEventModel)(sequelize);
    //Associations
    user_model_1.User.hasOne(userIdentityDocument_model_1.UserIdentityDocument, { foreignKey: 'userId', as: 'identityDocument' });
    user_model_1.User.hasOne(userDrivingInfo_model_1.UserDrivingInfo, { foreignKey: 'userId', as: 'drivingInfo' });
    user_model_1.User.hasMany(booking_model_1.Booking, { foreignKey: 'userId', as: 'bookings' });
    user_model_1.User.hasMany(payment_model_1.Payment, { foreignKey: 'userId', as: 'payments' });
    user_model_1.User.hasMany(refreshToken_model_1.RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });
    user_model_1.User.hasMany(chauffeurReview_model_1.ChauffeurReview, { foreignKey: 'userId', as: 'reviews' });
    userIdentityDocument_model_1.UserIdentityDocument.belongsTo(user_model_1.User, { foreignKey: 'userId', as: 'user' });
    userDrivingInfo_model_1.UserDrivingInfo.belongsTo(user_model_1.User, { foreignKey: 'userId', as: 'user' });
    vehicle_model_1.Vehicle.hasMany(vehicleMedia_model_1.VehicleMedia, { foreignKey: 'vehicleId', as: 'media' });
    vehicle_model_1.Vehicle.hasMany(booking_model_1.Booking, { foreignKey: 'vehicleId', as: 'bookings' });
    vehicleMedia_model_1.VehicleMedia.belongsTo(vehicle_model_1.Vehicle, {
        foreignKey: 'vehicleId',
        as: 'vehicle',
    });
    vehicle_model_1.Vehicle.belongsTo(location_model_1.Location, {
        foreignKey: 'locationId',
        as: 'location',
    });
    location_model_1.Location.hasMany(vehicle_model_1.Vehicle, {
        foreignKey: 'locationId',
        as: 'vehicles',
    });
    chauffeur_model_1.Chauffeur.hasMany(booking_model_1.Booking, { foreignKey: 'chauffeurId', as: 'bookings' });
    chauffeur_model_1.Chauffeur.hasMany(chauffeurReview_model_1.ChauffeurReview, { foreignKey: 'chauffeurId', as: 'reviews' });
    booking_model_1.Booking.belongsTo(user_model_1.User, { foreignKey: 'userId', as: 'user' });
    booking_model_1.Booking.belongsTo(vehicle_model_1.Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });
    booking_model_1.Booking.belongsTo(chauffeur_model_1.Chauffeur, { foreignKey: 'chauffeurId', as: 'chauffeur' });
    booking_model_1.Booking.hasOne(bookingFinancial_model_1.BookingFinancial, { foreignKey: 'bookingId', as: 'financial' });
    booking_model_1.Booking.hasMany(payment_model_1.Payment, { foreignKey: 'bookingId', as: 'payments' });
    booking_model_1.Booking.hasOne(chauffeurReview_model_1.ChauffeurReview, { foreignKey: 'bookingId', as: 'review' });
    bookingFinancial_model_1.BookingFinancial.belongsTo(booking_model_1.Booking, { foreignKey: 'bookingId', as: 'booking' });
    payment_model_1.Payment.belongsTo(booking_model_1.Booking, { foreignKey: 'bookingId', as: 'booking' });
    payment_model_1.Payment.belongsTo(user_model_1.User, { foreignKey: 'userId', as: 'user' });
    chauffeurReview_model_1.ChauffeurReview.belongsTo(booking_model_1.Booking, { foreignKey: 'bookingId', as: 'booking' });
    chauffeurReview_model_1.ChauffeurReview.belongsTo(chauffeur_model_1.Chauffeur, { foreignKey: 'chauffeurId', as: 'chauffeur' });
    chauffeurReview_model_1.ChauffeurReview.belongsTo(user_model_1.User, { foreignKey: 'userId', as: 'user' });
    refreshToken_model_1.RefreshToken.belongsTo(user_model_1.User, { foreignKey: 'userId', as: 'user' });
});
exports.initPostgres_DB = initPostgres_DB;
//# sourceMappingURL=index.js.map