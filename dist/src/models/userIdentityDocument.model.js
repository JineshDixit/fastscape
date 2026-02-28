"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initUserIdentityDocumentModel = exports.UserIdentityDocument = void 0;
/*
 * MANUAL MIGRATION QUERY:
 * ALTER TABLE user_identity_documents ADD COLUMN verification_status VARCHAR(50) DEFAULT 'PENDING';
 */
const sequelize_1 = require("sequelize");
class UserIdentityDocument extends sequelize_1.Model {
}
exports.UserIdentityDocument = UserIdentityDocument;
const initUserIdentityDocumentModel = (sequelize) => {
    UserIdentityDocument.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        driverLicenseFront: sequelize_1.DataTypes.TEXT,
        driverLicenseBack: sequelize_1.DataTypes.TEXT,
        passportPhoto: sequelize_1.DataTypes.TEXT,
        internationalDrivingPermit: sequelize_1.DataTypes.TEXT,
        selfieWithLicense: sequelize_1.DataTypes.TEXT,
        verified: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false,
        },
        verificationStatus: {
            type: sequelize_1.DataTypes.ENUM('PENDING', 'VERIFIED', 'REJECTED'),
            defaultValue: 'PENDING',
        },
        verificationDate: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
    }, {
        sequelize,
        freezeTableName: true,
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        underscored: true,
        tableName: 'user_identity_documents',
        modelName: 'UserIdentityDocument',
    });
};
exports.initUserIdentityDocumentModel = initUserIdentityDocumentModel;
//# sourceMappingURL=userIdentityDocument.model.js.map