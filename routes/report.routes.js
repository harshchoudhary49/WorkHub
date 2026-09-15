import { Router } from 'express';
import * as reportController from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  dateRangeReportSchema,
  taskReportSchema,
  leaveReportSchema,
  performanceReportSchema,
  employeeReportSchema,
} from '../utils/validators/report.validators.js';

const router = Router();
// Reports are Manager/HR/Admin - a manager's results are automatically
// scoped to their own team inside report.service.js, not by hiding routes.
router.use(authenticate, authorize('manager', 'hr', 'admin'));

router.get('/attendance', validate(dateRangeReportSchema, 'query'), reportController.attendance);
router.get('/leaves', validate(leaveReportSchema, 'query'), reportController.leaves);
router.get('/employees', validate(employeeReportSchema, 'query'), reportController.employees);
router.get('/tasks', validate(taskReportSchema, 'query'), reportController.tasks);
router.get('/performance', validate(performanceReportSchema, 'query'), reportController.performance);
router.get('/workload', validate(dateRangeReportSchema, 'query'), reportController.workload);

export default router;
