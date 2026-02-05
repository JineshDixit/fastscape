import { DataTypes, Model, Sequelize } from 'sequelize';

export class BookingFinancial extends Model {
  public id!: string;
  public bookingId!: string;
  public baseAmount!: number;
  public chauffeurAmount!: number;
  public chauffeurHours!: number;
  public depositAmount!: number;
  public balanceAmount!: number;
  public delayChargeAmount!: number;
  public delayChargeRate!: number;
  public taxAmount!: number;
  public platformChargeAmount!: number;
  public platformChargeRate!: number;
  public totalAmount!: number;
  public paidAmount!: number;
  public remainingAmount!: number;
  public currency!: string;
  public refundPolicy!: string;
  public refundableUntil!: Date;
  public depositPercentage!: number;
}

export const initBookingFinancialModel = (sequelize: Sequelize) => {
  BookingFinancial.init(
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
      baseAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      chauffeurAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Total cost for chauffeur service',
      },
      chauffeurHours: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Total hours of chauffeur service',
      },
      depositAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      balanceAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      delayChargeAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      delayChargeRate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Charge per hour for delay',
      },
      taxAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      platformChargeAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        comment: 'Total platform/gateway charges collected from user',
      },
      platformChargeRate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
        comment: 'Percentage rate used to calculate platform charges',
      },
      totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      paidAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      remainingAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'USD',
      },
      refundPolicy: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      refundableUntil: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      depositPercentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 20.0,
        comment: 'Percentage of base amount for deposit',
      },
    },
    {
      sequelize,
      freezeTableName: true,
      timestamps: true,
      createdAt: true,
      updatedAt: true,
      underscored: true,
      tableName: 'booking_financials',
      modelName: 'BookingFinancial',
    },
  );
};
