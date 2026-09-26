import { Optional } from 'sequelize';

export interface AdminRefreshTokenAttributes {
  id: string;
  adminUserId: string;
  token: string;
  expiresAt: Date;
  isRevoked: boolean;
  deviceInfo?: string;
  ipAddress?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AdminRefreshTokenCreationAttributes extends Optional<
  AdminRefreshTokenAttributes,
  'id' | 'isRevoked' | 'deviceInfo' | 'ipAddress' | 'createdAt' | 'updatedAt'
> {}
