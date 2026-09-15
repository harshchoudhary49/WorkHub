import { Router } from 'express';
import * as messageController from '../controllers/message.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { sendDirectMessageSchema, sendTeamMessageSchema } from '../utils/validators/message.validators.js';

const router = Router();
router.use(authenticate);

router.post('/direct', validate(sendDirectMessageSchema), messageController.sendDirect);
router.get('/direct/:employeeId', messageController.conversation);
router.get('/inbox', messageController.inbox);

router.post('/team/:teamId', validate(sendTeamMessageSchema), messageController.sendTeam);
router.get('/team/:teamId', messageController.teamMessages);

router.get('/my-teams', messageController.myTeams);

export default router;
