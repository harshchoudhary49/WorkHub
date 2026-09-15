import { Router } from 'express';
import * as goalController from '../controllers/goal.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createGoalSchema,
  updateOwnGoalSchema,
  reviewGoalSchema,
  goalQuerySchema,
} from '../utils/validators/goal.validators.js';

const router = Router();
router.use(authenticate);

router.post('/', validate(createGoalSchema), goalController.create);
router.get('/me', validate(goalQuerySchema, 'query'), goalController.myGoals);
router.get('/team', authorize('manager'), validate(goalQuerySchema, 'query'), goalController.teamGoals);
router.get('/', authorize('hr', 'admin'), validate(goalQuerySchema, 'query'), goalController.allGoals);

router.patch('/:id', validate(updateOwnGoalSchema), goalController.updateOwn);
router.post(
  '/:id/review',
  authorize('manager', 'hr', 'admin'),
  validate(reviewGoalSchema),
  goalController.review
);
router.delete('/:id', goalController.remove);

export default router;
