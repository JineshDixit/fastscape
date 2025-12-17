import { DataTypes, Model, Sequelize } from 'sequelize';

export class BookingFinancial extends Model {
  public id!: string;
  public bookingId!: string;
  public baseAmount!: number;
  public depositAmount!: number;
  public taxAmount!: number;
  public totalAmount!: number;
  public currency!: string;
  public refundPolicy!: string;
  public refundable_until!: Date;
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
      baseAmount: DataTypes.DECIMAL(10, 2),
      depositAmount: DataTypes.DECIMAL(10, 2),
      taxAmount: DataTypes.DECIMAL(10, 2),
      totalAmount: DataTypes.DECIMAL(10, 2),
      currency: DataTypes.STRING(3),
      refundPolicy: DataTypes.TEXT,
      refundable_until: DataTypes.DATE,
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
