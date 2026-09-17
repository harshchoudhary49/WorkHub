import { Router } from 'express';
import * as performanceController from '../controllers/performance.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { periodQuerySchema, feedbackSchema } from '../utils/validators/performance.validators.js';

const router = Router();
router.use(authenticate);

router.get('/me', validate(periodQuerySchema, 'query'), performanceController.myPerformance);
router.get('/me/history', performanceController.myHistory);
router.get(
  '/team',
  authorize('manager'),
  validate(periodQuerySchema, 'query'),
  performanceController.teamPerformance
);
router.get(
  '/:employeeId',
  authorize('manager', 'hr', 'admin'),
  validate(periodQuerySchema, 'query'),
  performanceController.employeePerformance
);
router.post(
  '/:employeeId/feedback',
  authorize('manager', 'hr', 'admin'),
  validate(feedbackSchema),
  performanceController.giveFeedback
);

export default router;
