import { Router } from 'express';
import * as officeController from '../controllers/office.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createOfficeSchema, updateOfficeSchema } from '../utils/validators/office.validators.js';

const router = Router();
router.use(authenticate);

router.get('/', officeController.list);
router.get('/:id', officeController.getOne);
router.post('/', authorize('admin'), validate(createOfficeSchema), officeController.create);
router.patch('/:id', authorize('admin'), validate(updateOfficeSchema), officeController.update);
router.delete('/:id', authorize('admin'), officeController.remove);

export default router;
