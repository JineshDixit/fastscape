import { DataTypes, Model, Sequelize } from 'sequelize';
import { dbEnums } from '../enum/dbEnums';

export class Payment extends Model {
  public id!: string;
  public bookigId!: string;
  public userId!: string;
  public amount!: number;
  public currency!: string;
  public stripePaymentIntentId!: string;
  public stripeChargeId!: string;
  public stripeRefundId!: string;
  public paymentType!: (typeof dbEnums.PAYMENT_TYPE)[number];
  public paymentStatus!: (typeof dbEnums.PAYMENT_STATUS)[number];
  public metadata!: JSON;
  public paidAt!: Date;
}

export const initPaymentModel = (sequelize: Sequelize) => {
  Payment.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      bookingId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'bookings',
          key: 'id',
        },
      },
      userID: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      amount: DataTypes.DECIMAL(10, 2),
      currency: DataTypes.STRING(3),
      stripePaymentIntentId: DataTypes.STRING(100),
      stripeChargeId: DataTypes.STRING(100),
      stripeRefundId: DataTypes.STRING(100),
      paymentType: DataTypes.ENUM(...dbEnums.PAYMENT_TYPE),
      paymentStatus: DataTypes.ENUM(...dbEnums.PAYMENT_STATUS),
      metadata: DataTypes.JSON,
      paidAt: DataTypes.DATE,
    },
    {
      sequelize,
      freezeTableName: true,
      timestamps: true,
      createdAt: true,
      updatedAt: true,
      underscored: true,
      tableName: 'payments',
      modelName: 'Payment',
    },
  );
};
