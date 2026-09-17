import { Router } from 'express';
import * as leaveController from '../controllers/leave.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  applyLeaveSchema,
  decideLeaveSchema,
  leaveQuerySchema,
} from '../utils/validators/leave.validators.js';

const router = Router();
router.use(authenticate);

// Static/self paths before the ":id" routes.
router.post('/', validate(applyLeaveSchema), leaveController.apply);
router.get('/me', validate(leaveQuerySchema, 'query'), leaveController.myLeaves);
router.get('/balance', leaveController.myBalances);
router.get('/team', authorize('manager'), validate(leaveQuerySchema, 'query'), leaveController.teamLeaves);
router.get('/', authorize('hr', 'admin'), validate(leaveQuerySchema, 'query'), leaveController.allLeaves);

router.post('/:id/cancel', leaveController.cancel);
router.post('/:id/approve', authorize('manager', 'hr', 'admin'), leaveController.approve);
router.post(
  '/:id/reject',
  authorize('manager', 'hr', 'admin'),
  validate(decideLeaveSchema),
  leaveController.reject
);

export default router;
