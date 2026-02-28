export type userModelType = {
  id?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  nationality?: string;
  email?: string;
  phone?: string;
  passwordHash?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  isBlocked?: boolean;
};

export interface CreateUserData {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  nationality?: string;
  email: string;
  phone?: string;
  passwordHash: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  nationality?: string;
  phone?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  // Driving Info
  licenseIssuingCountry?: string;
  licenseExpiryDate?: Date;
  drivingExperienceYears?: number;
  visaStatus?: string;
  // Documents (file paths will be handled internally, but these match form fields)
  driverLicenseFront?: any;
  driverLicenseBack?: any;
  passportPhoto?: any;
  internationalDrivingPermit?: any;
  selfieWithLicense?: any;
}

export interface UserLocationData {
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
