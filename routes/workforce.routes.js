import { Router } from 'express';
import * as workforceController from '../controllers/workforce.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { mapQuerySchema } from '../utils/validators/workforce.validators.js';

const router = Router();
// "Authorized managers" per the brief - simplified here to "any manager",
// since there's no separate per-manager permission flag yet. HR/Admin
// always have access. See README for the flag this would need to become
// truly per-manager.
router.use(authenticate, authorize('manager', 'hr', 'admin'));

router.get('/overview', workforceController.overview);
router.get('/map', validate(mapQuerySchema, 'query'), workforceController.map);

export default router;
