import { Router } from 'express';
import * as floorController from '../controllers/floor.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createFloorSchema, updateFloorSchema } from '../utils/validators/workforce.validators.js';

const router = Router();
// The Command Center (and its setup screens) is HR/Admin/Manager territory
// - regular employees have no reason to see office floor layouts.
router.use(authenticate, authorize('manager', 'hr', 'admin'));

router.get('/', floorController.list);
router.get('/:id', floorController.getOne);
router.post('/', authorize('hr', 'admin'), validate(createFloorSchema), floorController.create);
router.patch('/:id', authorize('hr', 'admin'), validate(updateFloorSchema), floorController.update);
router.delete('/:id', authorize('hr', 'admin'), floorController.remove);

export default router;
