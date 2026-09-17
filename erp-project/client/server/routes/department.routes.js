import { Router } from 'express';
import * as departmentController from '../controllers/department.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createDepartmentSchema,
  updateDepartmentSchema,
} from '../utils/validators/department.validators.js';

const router = Router();
router.use(authenticate);

router.get('/', departmentController.list);
router.get('/:id', departmentController.getOne);
router.post(
  '/',
  authorize('hr', 'admin'),
  validate(createDepartmentSchema),
  departmentController.create
);
router.patch(
  '/:id',
  authorize('hr', 'admin'),
  validate(updateDepartmentSchema),
  departmentController.update
);
router.delete('/:id', authorize('hr', 'admin'), departmentController.remove);

export default router;
