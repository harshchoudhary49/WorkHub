import { Router } from 'express';
import * as teamController from '../controllers/team.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createTeamSchema, updateTeamSchema } from '../utils/validators/team.validators.js';

const router = Router();
router.use(authenticate);

router.get('/', teamController.list);
router.get('/:id', teamController.getOne);
router.post('/', authorize('hr', 'admin'), validate(createTeamSchema), teamController.create);
router.patch(
  '/:id',
  authorize('hr', 'admin'),
  validate(updateTeamSchema),
  teamController.update
);
router.delete('/:id', authorize('hr', 'admin'), teamController.remove);

export default router;
