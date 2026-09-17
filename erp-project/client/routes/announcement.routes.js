import { Router } from 'express';
import * as announcementController from '../controllers/announcement.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createAnnouncementSchema } from '../utils/validators/announcement.validators.js';

const router = Router();
router.use(authenticate);

router.get('/', announcementController.listForMe);
router.get('/all', authorize('hr', 'admin'), announcementController.listAll);
router.post(
  '/',
  authorize('hr', 'admin'),
  validate(createAnnouncementSchema),
  announcementController.create
);
router.delete('/:id', authorize('hr', 'admin'), announcementController.remove);

export default router;
