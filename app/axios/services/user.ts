import { BaseApiService } from '../base';
import type { ApiResponse, UserProfile, UpdateProfileRequest } from '../../../common/interfaces';

export class UserService extends BaseApiService {
  constructor() {
    super('/users');
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    return this.get<UserProfile>('/profile');
  }

  /**
   * Update user profile with form data (supports file uploads)
   */
  async updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<UserProfile>> {
    const formData = new FormData();

    // Add text fields
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        if (value instanceof File) {
          // Skip files, handled below
          return;
        }
        if (typeof value === 'object' && value !== null) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });

    // Add file fields
    const fileFields = [
      'driverLicenseFront',
      'driverLicenseBack',
      'passportPhoto',
      'internationalDrivingPermit',
      'selfieWithLicense',
    ] as const;

    fileFields.forEach((field) => {
      const file = data[field];
      if (file instanceof File) {
        formData.append(field, file);
      }
    });

    return this.put<UserProfile, FormData>('/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Check booking eligibility (comprehensive check)
   */
  async checkBookingEligibility(): Promise<
    ApiResponse<{
      eligible: boolean;
      reason?: string;
      restrictions?: any;
      missingDocuments?: string[];
      verificationStatus?: string;
    }>
  > {
    return this.get('/documents/eligibility');
  }
}

export const userService = new UserService();
