// Basic Address Interface (matching backend model)
export interface AddressType {
  id?: string;
  type: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
}

export type userModelType = {
  id?: string;
  fullName?: string;
  dateOfBirth?: Date;
  nationality?: string;
  email?: string;
  phone?: string;
  passwordHash?: string;
  isBlocked?: boolean;
  addresses?: AddressType[];
};

export interface CreateUserData {
  fullName: string;
  dateOfBirth: Date;
  nationality?: string;
  email: string;
  phone?: string;
  passwordHash: string;
  // Initial address
  addressLine1?: string;
  addressLine2?: string;
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
  addresses?: AddressType[];
  // Driving Info
  licenseIssuingCountry?: string;
  licenseExpiryDate?: Date;
  drivingExperienceYears?: string;
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
