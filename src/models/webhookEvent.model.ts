import { DataTypes, Model, Sequelize } from 'sequelize';

export class WebhookEvent extends Model {
  public id!: string;
  public eventId!: string;
  public eventType!: string;
  public provider!: string;
  public payload!: JSON;
  public processed!: boolean;
  public processedAt!: Date;
  public error!: string;
  public retryCount!: number;
}

export const initWebhookEventModel = (sequelize: Sequelize) => {
  WebhookEvent.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      eventId: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'External event ID from payment provider (e.g., Stripe event ID)',
      },
      eventType: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Type of webhook event (e.g., payment_intent.succeeded)',
      },
      provider: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'stripe',
        comment: 'Payment provider name',
      },
      payload: {
        type: DataTypes.JSONB,
        allowNull: false,
        comment: 'Full webhook payload',
      },
      processed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether the event has been successfully processed',
      },
      processedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Timestamp when the event was processed',
      },
      error: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Error message if processing failed',
      },
      retryCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Number of processing attempts',
      },
    },
    {
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
    },
  );
};
