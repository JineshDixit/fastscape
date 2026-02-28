import { DataTypes, Model, Sequelize } from 'sequelize';
import { dbEnums } from '../common/enum/dbEnums';

export class Payment extends Model {
  public id!: string;
  public bookingId!: string;
  public userId!: string;
  public amount!: number;
  public gatewayFeeAmount!: number;
  public platformChargeAmount!: number;
  public currency!: string;
  public stripePaymentIntentId!: string;
  public stripeChargeId!: string;
  public stripeRefundId!: string;
  public paymentType!: (typeof dbEnums.PAYMENT_TYPE)[number];
  public paymentStatus!: (typeof dbEnums.PAYMENT_STATUS)[number];
  public paymentMethod!: (typeof dbEnums.PAYMENT_METHOD)[number];
  public metadata!: JSON;
  public paidAt!: Date;
  public failureReason!: string;
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
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      gatewayFeeAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        comment: 'Fees deducted by the payment gateway (e.g., Stripe fees)',
      },
      platformChargeAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        comment: 'Portion of this payment allocated to platform charges',
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'USD',
      },
      stripePaymentIntentId: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      stripeChargeId: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      stripeRefundId: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      paymentType: {
        type: DataTypes.ENUM(...dbEnums.PAYMENT_TYPE),
        allowNull: false,
      },
      paymentStatus: {
        type: DataTypes.ENUM(...dbEnums.PAYMENT_STATUS),
        allowNull: false,
        defaultValue: 'UNPAID',
      },
      paymentMethod: {
        type: DataTypes.ENUM(...dbEnums.PAYMENT_METHOD),
        allowNull: false,
        defaultValue: 'ONLINE',
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      paidAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      failureReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
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
