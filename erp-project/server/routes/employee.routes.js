import { Router } from 'express';
import * as employeeController from '../controllers/employee.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createEmployeeSchema,
  updateEmployeeAdminSchema,
  updateOwnProfileSchema,
} from '../utils/validators/employee.validators.js';

const router = Router();
router.use(authenticate); // every route below requires a valid access token

// Specific/static paths must be declared before the "/:id" param route,
// otherwise Express would try to treat "me" or "admin-check" as an :id.
router.patch('/me', validate(updateOwnProfileSchema), employeeController.updateOwnProfile);
router.get('/admin-check', authorize('hr', 'admin'), employeeController.adminOnlyPing);

router.get('/', employeeController.listEmployees);
router.post(
  '/',
  authorize('hr', 'admin'),
  validate(createEmployeeSchema),
  employeeController.createEmployee
);

router.get('/:id', employeeController.getEmployee);
router.patch(
  '/:id',
  authorize('hr', 'admin'),
  validate(updateEmployeeAdminSchema),
  employeeController.updateEmployeeAdmin
);
router.post('/:id/deactivate', authorize('hr', 'admin'), employeeController.deactivateEmployee);
router.delete('/:id', authorize('admin'), employeeController.removeEmployee);

export default router;
