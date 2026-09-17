import { Router } from 'express';
import * as deskController from '../controllers/desk.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createDeskSchema, updateDeskSchema, assignDeskSchema } from '../utils/validators/workforce.validators.js';

const router = Router();
router.use(authenticate, authorize('manager', 'hr', 'admin'));

router.get('/', deskController.list);
router.post('/', authorize('hr', 'admin'), validate(createDeskSchema), deskController.create);
router.patch('/:id', authorize('hr', 'admin'), validate(updateDeskSchema), deskController.update);
router.delete('/:id', authorize('hr', 'admin'), deskController.remove);
router.post('/:id/assign', authorize('hr', 'admin'), validate(assignDeskSchema), deskController.assign);
router.post('/:id/unassign', authorize('hr', 'admin'), deskController.unassign);

export default router;
