import { Router } from 'express';
import * as recognitionController from '../controllers/recognition.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { giveRecognitionSchema } from '../utils/validators/recognition.validators.js';

const router = Router();
router.use(authenticate);

router.post('/', validate(giveRecognitionSchema), recognitionController.give);
router.get('/feed', recognitionController.feed);
router.get('/me', recognitionController.mine);

export default router;
