import { Router } from 'express';
import * as attendanceController from '../controllers/attendance.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  checkInSchema,
  checkOutSchema,
  monthQuerySchema,
  manualMarkSchema,
  teamAttendanceQuerySchema,
} from '../utils/validators/attendance.validators.js';

const router = Router();
router.use(authenticate);

router.post('/check-in', validate(checkInSchema), attendanceController.doCheckIn);
router.post('/check-out', validate(checkOutSchema), attendanceController.doCheckOut);
router.get('/me', validate(monthQuerySchema, 'query'), attendanceController.myAttendance);

router.get(
  '/team',
  authorize('manager'),
  validate(teamAttendanceQuerySchema, 'query'),
  attendanceController.teamAttendance
);

router.post('/mark-absentees', authorize('hr', 'admin'), attendanceController.markAbsentees);
router.post(
  '/manual',
  authorize('hr', 'admin'),
  validate(manualMarkSchema),
  attendanceController.manualMark
);

router.get(
  '/:employeeId',
  authorize('manager', 'hr', 'admin'),
  validate(monthQuerySchema, 'query'),
  attendanceController.employeeAttendance
);

export default router;
