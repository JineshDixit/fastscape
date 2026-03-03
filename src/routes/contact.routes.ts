import { Router } from 'express';
import { submitContactUs } from '../controller/contact/contact.controller';
import { validateContactUs } from '../services/middleware/validation';
import { contactLimiter } from '../services/middleware/rateLimiter';

const router = Router();

// Public contact endpoint
router.post('/', contactLimiter, validateContactUs, submitContactUs);

export default router;

