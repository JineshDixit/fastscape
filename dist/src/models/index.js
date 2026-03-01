"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Location = exports.BookingFinancial = exports.Chauffeur = exports.ChauffeurReview = exports.Payment = exports.Booking = exports.UserDrivingInfo = exports.UserIdentityDocument = exports.User = exports.VehicleMedia = exports.Vehicle = exports.AdminRefreshToken = exports.AdminUserRole = exports.RolePolicy = exports.Policy = exports.Role = exports.AdminUser = exports.sequelize = exports.initPostgres_DB = void 0;
const sequelize_1 = require("sequelize");
const dbConfig_1 = __importDefault(require("../config/database/dbConfig"));
const AdminUser_1 = require("./AdminUser");
Object.defineProperty(exports, "AdminUser", { enumerable: true, get: function () { return AdminUser_1.AdminUser; } });
const Role_1 = require("./Role");
Object.defineProperty(exports, "Role", { enumerable: true, get: function () { return Role_1.Role; } });
const Policy_1 = require("./Policy");
Object.defineProperty(exports, "Policy", { enumerable: true, get: function () { return Policy_1.Policy; } });
const RolePolicy_1 = require("./RolePolicy");
Object.defineProperty(exports, "RolePolicy", { enumerable: true, get: function () { return RolePolicy_1.RolePolicy; } });
const AdminUserRole_1 = require("./AdminUserRole");
Object.defineProperty(exports, "AdminUserRole", { enumerable: true, get: function () { return AdminUserRole_1.AdminUserRole; } });
const AdminRefreshToken_1 = require("./AdminRefreshToken");
Object.defineProperty(exports, "AdminRefreshToken", { enumerable: true, get: function () { return AdminRefreshToken_1.AdminRefreshToken; } });
const vehicle_model_1 = require("./vehicle.model");
Object.defineProperty(exports, "Vehicle", { enumerable: true, get: function () { return vehicle_model_1.Vehicle; } });
const vehicleMedia_model_1 = require("./vehicleMedia.model");
Object.defineProperty(exports, "VehicleMedia", { enumerable: true, get: function () { return vehicleMedia_model_1.VehicleMedia; } });
const user_model_1 = require("./user.model");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return user_model_1.User; } });
const userIdentityDocument_model_1 = require("./userIdentityDocument.model");
Object.defineProperty(exports, "UserIdentityDocument", { enumerable: true, get: function () { return userIdentityDocument_model_1.UserIdentityDocument; } });
const userDrivingInfo_model_1 = require("./userDrivingInfo.model");
Object.defineProperty(exports, "UserDrivingInfo", { enumerable: true, get: function () { return userDrivingInfo_model_1.UserDrivingInfo; } });
const booking_model_1 = require("./booking.model");
Object.defineProperty(exports, "Booking", { enumerable: true, get: function () { return booking_model_1.Booking; } });
const payment_model_1 = require("./payment.model");
Object.defineProperty(exports, "Payment", { enumerable: true, get: function () { return payment_model_1.Payment; } });
const chauffeurReview_model_1 = require("./chauffeurReview.model");
Object.defineProperty(exports, "ChauffeurReview", { enumerable: true, get: function () { return chauffeurReview_model_1.ChauffeurReview; } });
const chauffeur_model_1 = require("./chauffeur.model");
Object.defineProperty(exports, "Chauffeur", { enumerable: true, get: function () { return chauffeur_model_1.Chauffeur; } });
const bookingFinancial_model_1 = require("./bookingFinancial.model");
Object.defineProperty(exports, "BookingFinancial", { enumerable: true, get: function () { return bookingFinancial_model_1.BookingFinancial; } });
const location_model_1 = require("./location.model");
Object.defineProperty(exports, "Location", { enumerable: true, get: function () { return location_model_1.Location; } });
let sequelize;
/**
 * Initializes the PostgreSQL database by setting up a Sequelize
 * instance with the database configuration and defining the models
 * for the database tables.
 *
 * @returns {void} - nothing
 */
const initPostgres_DB = () => {
    const startTime = Date.now();
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
        logging: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 60000,
            idle: 10000,
            evict: 1000 * 60 * 10,
        },
    });
    (0, AdminUser_1.initAdminUserModel)(sequelize);
    (0, Role_1.initRoleModel)(sequelize);
    (0, Policy_1.initPolicyModel)(sequelize);
    (0, RolePolicy_1.initRolePolicyModel)(sequelize);
    (0, AdminUserRole_1.initAdminUserRoleModel)(sequelize);
    (0, AdminRefreshToken_1.initAdminRefreshTokenModel)(sequelize);
    (0, vehicle_model_1.initVehicleModel)(sequelize);
    (0, vehicleMedia_model_1.initVehicleMediaModel)(sequelize);
    (0, user_model_1.initUserModel)(sequelize);
    (0, userIdentityDocument_model_1.initUserIdentityDocumentModel)(sequelize);
    (0, userDrivingInfo_model_1.initUserDrivingInfoModel)(sequelize);
    (0, booking_model_1.initBookingModel)(sequelize);
    (0, payment_model_1.initPaymentModel)(sequelize);
    (0, chauffeurReview_model_1.initChauffeurReviewModel)(sequelize);
    (0, chauffeur_model_1.initChauffeurModel)(sequelize);
    (0, bookingFinancial_model_1.initBookingFinancialModel)(sequelize);
    (0, location_model_1.initLocationModel)(sequelize);
    // Associations
    AdminUser_1.AdminUser.belongsToMany(Role_1.Role, {
        through: AdminUserRole_1.AdminUserRole,
        foreignKey: 'adminUserId',
        otherKey: 'roleId',
    });
    Role_1.Role.belongsToMany(AdminUser_1.AdminUser, {
        through: AdminUserRole_1.AdminUserRole,
        foreignKey: 'roleId',
        otherKey: 'adminUserId',
    });
    Role_1.Role.belongsToMany(Policy_1.Policy, {
        through: RolePolicy_1.RolePolicy,
        foreignKey: 'roleId',
        otherKey: 'policyId',
    });
    Policy_1.Policy.belongsToMany(Role_1.Role, {
        through: RolePolicy_1.RolePolicy,
        foreignKey: 'policyId',
        otherKey: 'roleId',
    });
    AdminUser_1.AdminUser.hasMany(AdminRefreshToken_1.AdminRefreshToken, {
        foreignKey: 'adminUserId',
    });
    AdminRefreshToken_1.AdminRefreshToken.belongsTo(AdminUser_1.AdminUser, {
        foreignKey: 'adminUserId',
    });
    // Junction table associations
    AdminUserRole_1.AdminUserRole.belongsTo(AdminUser_1.AdminUser, { foreignKey: 'adminUserId' });
    AdminUserRole_1.AdminUserRole.belongsTo(Role_1.Role, { foreignKey: 'roleId' });
    AdminUserRole_1.AdminUserRole.belongsTo(AdminUser_1.AdminUser, { foreignKey: 'assignedBy', as: 'AssignedByUser' });
    RolePolicy_1.RolePolicy.belongsTo(Role_1.Role, { foreignKey: 'roleId' });
    RolePolicy_1.RolePolicy.belongsTo(Policy_1.Policy, { foreignKey: 'policyId' });
    // Vehicle associations
    vehicle_model_1.Vehicle.hasMany(vehicleMedia_model_1.VehicleMedia, {
        foreignKey: 'vehicleId',
        as: 'media',
    });
    vehicleMedia_model_1.VehicleMedia.belongsTo(vehicle_model_1.Vehicle, {
        foreignKey: 'vehicleId',
        as: 'vehicle',
    });
    // Vehicle-Location association
    vehicle_model_1.Vehicle.belongsTo(location_model_1.Location, {
        foreignKey: 'locationId',
        as: 'location',
    });
    location_model_1.Location.hasMany(vehicle_model_1.Vehicle, {
        foreignKey: 'locationId',
        as: 'vehicles',
    });
    user_model_1.User.hasOne(userIdentityDocument_model_1.UserIdentityDocument, { foreignKey: 'userId' });
    user_model_1.User.hasOne(userDrivingInfo_model_1.UserDrivingInfo, { foreignKey: 'userId' });
    user_model_1.User.hasMany(booking_model_1.Booking, { foreignKey: 'userId' });
    user_model_1.User.hasMany(payment_model_1.Payment, { foreignKey: 'userId' });
    user_model_1.User.hasMany(chauffeurReview_model_1.ChauffeurReview, { foreignKey: 'userId' });
    vehicle_model_1.Vehicle.hasMany(booking_model_1.Booking, { foreignKey: 'vehicleId' });
    chauffeur_model_1.Chauffeur.hasMany(booking_model_1.Booking, { foreignKey: 'chauffeurId' });
    chauffeur_model_1.Chauffeur.hasMany(chauffeurReview_model_1.ChauffeurReview, { foreignKey: 'chauffeurId' });
    booking_model_1.Booking.belongsTo(user_model_1.User, { foreignKey: 'userId' });
    booking_model_1.Booking.belongsTo(vehicle_model_1.Vehicle, { foreignKey: 'vehicleId' });
    booking_model_1.Booking.belongsTo(chauffeur_model_1.Chauffeur, { foreignKey: 'chauffeurId' });
    booking_model_1.Booking.hasOne(bookingFinancial_model_1.BookingFinancial, { foreignKey: 'bookingId' });
    booking_model_1.Booking.hasMany(payment_model_1.Payment, { foreignKey: 'bookingId' });
    booking_model_1.Booking.hasOne(chauffeurReview_model_1.ChauffeurReview, { foreignKey: 'bookingId' });
    bookingFinancial_model_1.BookingFinancial.belongsTo(booking_model_1.Booking, { foreignKey: 'bookingId' });
    payment_model_1.Payment.belongsTo(booking_model_1.Booking, { foreignKey: 'bookingId' });
    payment_model_1.Payment.belongsTo(user_model_1.User, { foreignKey: 'userId' });
    chauffeurReview_model_1.ChauffeurReview.belongsTo(booking_model_1.Booking, { foreignKey: 'bookingId' });
    chauffeurReview_model_1.ChauffeurReview.belongsTo(chauffeur_model_1.Chauffeur, { foreignKey: 'chauffeurId' });
    chauffeurReview_model_1.ChauffeurReview.belongsTo(user_model_1.User, { foreignKey: 'userId' });
};
exports.initPostgres_DB = initPostgres_DB;
//# sourceMappingURL=index.js.map