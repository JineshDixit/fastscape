import { Router } from 'express';
import { locationController } from '../controller/location/location.controller';

const router = Router();

router.get('/', locationController.getLocations);

export default router;
