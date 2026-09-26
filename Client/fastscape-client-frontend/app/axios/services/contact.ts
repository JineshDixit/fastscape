import { BaseApiService } from '../base';
import type { ApiResponse, ContactUsRequest, ContactUsResponse } from '../../../common/interfaces';

class ContactService extends BaseApiService {
  constructor() {
    super('/contact-us');
  }

  /**
   * Submit contact-us message
   */
  async submitContactUs(data: ContactUsRequest): Promise<ApiResponse<ContactUsResponse>> {
    return this.post<ContactUsResponse>('', data);
  }
}

export const contactService = new ContactService();
