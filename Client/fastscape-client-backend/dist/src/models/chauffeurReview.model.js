"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initChauffeurReviewModel = exports.ChauffeurReview = void 0;
const sequelize_1 = require("sequelize");
class ChauffeurReview extends sequelize_1.Model {
}
exports.ChauffeurReview = ChauffeurReview;
const initChauffeurReviewModel = (sequelize) => {
    ChauffeurReview.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        bookingId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'bookings',
                key: 'id',
            },
        },
        chauffeurId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'chauffeurs',
                key: 'id',
            },
        },
        userId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        rating: {
            type: sequelize_1.DataTypes.DECIMAL(3, 2),
            allowNull: false,
            validate: {
                min: 1,
                max: 5,
            },
        },
        comment: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        drivingSkillRating: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 5,
            },
        },
        punctualityRating: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 5,
            },
        },
        professionalismRating: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 5,
            },
        },
        vehicleConditionRating: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 5,
            },
        },
        wouldRecommend: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    }, {
        sequelize,
        freezeTableName: true,
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        underscored: true,
        tableName: 'chauffeur_reviews',
        modelName: 'ChauffeurReview',
        indexes: [
            {
                fields: ['chauffeur_id'],
            },
            {
                fields: ['user_id'],
            },
            {
                fields: ['booking_id'],
                unique: true, // One review per booking
            },
            {
                fields: ['rating'],
            },
        ],
    });
};
exports.initChauffeurReviewModel = initChauffeurReviewModel;
//# sourceMappingURL=chauffeurReview.model.js.map