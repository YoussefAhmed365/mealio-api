// routes/agentRoutes.js
import { Router } from 'express';
import { askAgent } from '../controllers/agentController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';
const router = Router();

router.post('/ask', optionalAuth, askAgent);

export default router;