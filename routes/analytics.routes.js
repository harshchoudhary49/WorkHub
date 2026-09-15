import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';

const router = Router();
router.use(authenticate, authorize('hr', 'admin'));

router.get('/overview', analyticsController.overview);
router.get('/attendance-trend', analyticsController.attendanceTrend);
router.get('/task-completion-by-department', analyticsController.taskCompletionByDepartment);
router.get('/headcount-by-department', analyticsController.headcountByDepartment);

export default router;
