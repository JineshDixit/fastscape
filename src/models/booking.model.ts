import { DataTypes, Model, Sequelize } from 'sequelize';
import { dbEnums } from '../common/enum/dbEnums';

export class Booking extends Model {
  public id!: string;
  public userId!: string;
  public vehicleId!: string;
  public chauffeurId!: string;
  public startDatetime!: Date;
  public endDatetime!: Date;
  public actualPickupDatetime!: Date;
  public actualDropoffDatetime!: Date;
  public pickupLocation!: string;
  public dropoffLocation!: string;
  public bookingType!: (typeof dbEnums.BOOKING_TYPE)[number];
  public bookingStatus!: (typeof dbEnums.BOOKING_STATUS)[number];
  public paymentStatus!: (typeof dbEnums.PAYMENT_STATUS)[number];
  public paymentMethod!: (typeof dbEnums.PAYMENT_METHOD)[number];
  public delayChargeApplied!: boolean;
  public delayHours!: number;
  public chauffeurInstructions!: string;
  public notes!: string;
  public expiresAt!: Date | null;
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
      chauffeurId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'chauffeurs',
          key: 'id',
        },
      },
      startDatetime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      endDatetime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      actualPickupDatetime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      actualDropoffDatetime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      pickupLocation: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      dropoffLocation: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      bookingType: {
        type: DataTypes.ENUM(...dbEnums.BOOKING_TYPE),
        allowNull: false,
        defaultValue: 'SELF_DRIVE',
      },
      bookingStatus: {
        type: DataTypes.ENUM(...dbEnums.BOOKING_STATUS),
        defaultValue: 'PENDING',
      },
      paymentStatus: {
        type: DataTypes.ENUM(...dbEnums.PAYMENT_STATUS),
        defaultValue: 'UNPAID',
      },
      paymentMethod: {
        type: DataTypes.ENUM(...dbEnums.PAYMENT_METHOD),
        allowNull: false,
        defaultValue: 'ONLINE',
      },
      delayChargeApplied: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      delayHours: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
      },
      chauffeurInstructions: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Special instructions for the chauffeur',
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Timestamp when the pending booking expires',
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
