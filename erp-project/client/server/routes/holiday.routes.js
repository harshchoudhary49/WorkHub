import { Router } from 'express';
import * as holidayController from '../controllers/holiday.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createHolidaySchema, updateHolidaySchema } from '../utils/validators/holiday.validators.js';

const router = Router();
router.use(authenticate);

router.get('/', holidayController.list);
router.post('/', authorize('hr', 'admin'), validate(createHolidaySchema), holidayController.create);
router.patch(
  '/:id',
  authorize('hr', 'admin'),
  validate(updateHolidaySchema),
  holidayController.update
);
router.delete('/:id', authorize('hr', 'admin'), holidayController.remove);

export default router;
