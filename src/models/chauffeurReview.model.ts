import { DataTypes, Model, Sequelize } from 'sequelize';

export class ChauffeurReview extends Model {
  public id!: string;
  public bookingId!: string;
  public chauffeurId!: string;
  public userId!: string;
  public rating!: number;
  public comment!: string;
  public drivingSkillRating!: number;
  public punctualityRating!: number;
  public professionalismRating!: number;
  public vehicleConditionRating!: number;
  public wouldRecommend!: boolean;
}

export const initChauffeurReviewModel = (sequelize: Sequelize) => {
  ChauffeurReview.init(
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
      chauffeurId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'chauffeurs',
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
      rating: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      drivingSkillRating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
      },
      punctualityRating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
      },
      professionalismRating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
      },
      vehicleConditionRating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
      },
      wouldRecommend: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
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
    },
  );
};
