export type userModelType = {
  id?: string;
  fullName?: string;
  dateOfBirth?: Date;
  nationality?: string;
  email?: string;
  phone?: string;
  passwordHash?: string;
  homeAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  isBlocked?: boolean;
};

export interface CreateUserData {
  fullName: string;
  dateOfBirth: Date;
  nationality?: string;
  email: string;
  phone?: string;
  passwordHash: string;
  homeAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface UpdateUserData {
  fullName?: string;
  dateOfBirth?: Date;
  nationality?: string;
  phone?: string;
  homeAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface UserLocationData {
  homeAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface UserWithLocation extends userModelType {
  locationSummary?: string;
  addressCompleteness?: 'COMPLETE' | 'PARTIAL' | 'MISSING';
}

export interface LocationSearchQuery {
  city?: string;
  state?: string;
  country?: string;
  radius?: number; // For future geo-location features
}