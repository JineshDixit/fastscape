import { Request, Response } from 'express';
import { BaseController } from '../../utils/controller.utils';
import { sendSuccess } from '../../utils/response.utils';
import { ContactUsRequest } from '../../common/types/contactTypes';
import { contactService } from '../../services/contact/contact.service';

class ContactController extends BaseController {
  /**
   * Submit contact-us request
   */
  submitContactUs = this.asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body as ContactUsRequest;
    const result = await contactService.submitContactUs(payload);

    sendSuccess(res, 'Contact request submitted successfully', {
      queued: true,
      messageId: result.messageId,
    });
  });
}

const contactController = new ContactController();

export const { submitContactUs } = contactController;

