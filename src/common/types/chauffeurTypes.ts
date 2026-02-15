export interface ChauffeurAvailabilityQuery {
  startDatetime: Date;
  endDatetime: Date;
  vehicleType?: string;
  city?: string;
  minRating?: number;
  maxHourlyRate?: number;
  languages?: string[];
  experienceLevel?: string;
  isVerified?: boolean;
}

export interface CreateChauffeurData {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  nationality: string;
  licenseNumber: string;
  licenseExpiryDate: Date;
  licenseIssuingCountry: string;
  experienceLevel: string;
  yearsOfExperience: number;
  languages: string[];
  specializations: string[];
  hourlyRate: number;
  emergencyContactName: string;
  emergencyContactPhone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  profilePhoto?: string;
  notes?: string;
}

export interface UpdateChauffeurData {
  fullName?: string;
  phone?: string;
  experienceLevel?: string;
  yearsOfExperience?: number;
  languages?: string[];
  specializations?: string[];
  hourlyRate?: number;
  status?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  profilePhoto?: string;
  notes?: string;
}
