import { BaseApiService } from '../base';
import type { ApiResponse, AssignmentStatusResponse } from '../../../common/interfaces';

export type { AssignmentStatusResponse };

export class ChauffeurAssignmentService extends BaseApiService {
  constructor() {
    super('/chauffeur-assignment');
  }

  /**
   * Check chauffeur assignment status for a booking
   */
  async checkAssignmentStatus(bookingId: string): Promise<ApiResponse<AssignmentStatusResponse>> {
    return this.get<AssignmentStatusResponse>(`/${bookingId}/status`);
  }
}

export const chauffeurAssignmentService = new ChauffeurAssignmentService();
