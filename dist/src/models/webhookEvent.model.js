"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initWebhookEventModel = exports.WebhookEvent = void 0;
const sequelize_1 = require("sequelize");
class WebhookEvent extends sequelize_1.Model {
}
exports.WebhookEvent = WebhookEvent;
const initWebhookEventModel = (sequelize) => {
    WebhookEvent.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        eventId: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: false,
            comment: 'External event ID from payment provider (e.g., Stripe event ID)',
        },
        eventType: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: false,
            comment: 'Type of webhook event (e.g., payment_intent.succeeded)',
        },
        provider: {
            type: sequelize_1.DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'stripe',
            comment: 'Payment provider name',
        },
        payload: {
            type: sequelize_1.DataTypes.JSONB,
            allowNull: false,
            comment: 'Full webhook payload',
        },
        processed: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Whether the event has been successfully processed',
        },
        processedAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
            comment: 'Timestamp when the event was processed',
        },
        error: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
            comment: 'Error message if processing failed',
        },
        retryCount: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Number of processing attempts',
        },
    }, {
        sequelize,
        freezeTableName: true,
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        underscored: true,
        tableName: 'webhook_events',
        modelName: 'WebhookEvent',
        indexes: [
            {
                fields: ['event_id'],
                unique: true,
            },
            {
                fields: ['event_type'],
            },
            {
                fields: ['processed'],
            },
            {
                fields: ['created_at'],
            },
            {
                fields: ['provider'],
            },
        ],
    });
};
exports.initWebhookEventModel = initWebhookEventModel;
//# sourceMappingURL=webhookEvent.model.js.map