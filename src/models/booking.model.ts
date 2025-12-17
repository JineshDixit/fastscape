import { DataTypes, Model, Sequelize } from 'sequelize';
import { dbEnums } from '../common/enum/dbEnums';

export class Booking extends Model {
  public id!: string;
  public userId!: string;
  public vehicleId!: string;
  public startDatetime!: Date;
  public endDatetime!: Date;
  public pickupLocation!: string;
  public dropoffLocation!: string;
  public bookingStatus!: (typeof dbEnums.BOOKING_STATUS)[number];
  public paymentStatus!: (typeof dbEnums.PAYMENT_STATUS)[number];
}

export const initBookingModel = (sequelize: Sequelize) => {
  Booking.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      vehicleId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'vehicles',
          key: 'id',
        },
      },
      startDatetime: DataTypes.DATE,
      endDatetime: DataTypes.DATE,
      pickupLocation: DataTypes.TEXT,
      dropoffLocation: DataTypes.TEXT,
      bookingStatus: {
        type: DataTypes.ENUM(...dbEnums.BOOKING_STATUS),
        defaultValue: 'PENDING',
      },
      paymentStatus: {
        type: DataTypes.ENUM(...dbEnums.PAYMENT_STATUS),
        defaultValue: 'UNPAID',
      },
    },
    {
      sequelize,
      freezeTableName: true,
      timestamps: true,
      createdAt: true,
      updatedAt: true,
      underscored: true,
      tableName: 'bookings',
      modelName: 'Booking',
    },
  );
};
