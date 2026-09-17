import { Router } from 'express';
import * as taskController from '../controllers/task.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createTaskSchema,
  updateTaskSchema,
  updateStatusSchema,
  taskQuerySchema,
} from '../utils/validators/task.validators.js';

const router = Router();
router.use(authenticate);

router.post('/', authorize('manager', 'hr', 'admin'), validate(createTaskSchema), taskController.create);
router.get('/me', validate(taskQuerySchema, 'query'), taskController.myTasks);
router.get('/team', authorize('manager'), validate(taskQuerySchema, 'query'), taskController.teamTasks);
router.get('/', authorize('hr', 'admin'), validate(taskQuerySchema, 'query'), taskController.allTasks);

router.patch('/:id/status', validate(updateStatusSchema), taskController.updateStatus);
router.patch(
  '/:id',
  authorize('manager', 'hr', 'admin'),
  validate(updateTaskSchema),
  taskController.update
);
router.delete('/:id', authorize('manager', 'hr', 'admin'), taskController.remove);

export default router;
