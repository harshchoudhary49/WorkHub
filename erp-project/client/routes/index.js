import { Router } from 'express';
import authRoutes from './auth.routes.js';
import employeeRoutes from './employee.routes.js';
import officeRoutes from './office.routes.js';
import departmentRoutes from './department.routes.js';
import teamRoutes from './team.routes.js';
import attendanceRoutes from './attendance.routes.js';
import holidayRoutes from './holiday.routes.js';
import leaveRoutes from './leave.routes.js';
import notificationRoutes from './notification.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/offices', officeRoutes);
router.use('/departments', departmentRoutes);
router.use('/teams', teamRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/holidays', holidayRoutes);
router.use('/leaves', leaveRoutes);
router.use('/notifications', notificationRoutes);

// Phase 6: /tasks
// Phase 7: /goals /performance   Phase 8: /notifications (expanded) /messages
// Phase 9+: /analytics /announcements

export default router;
