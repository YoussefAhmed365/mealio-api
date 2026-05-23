// routes/agentRoutes.js
import { Router } from 'express';
import { askAgent } from '../controllers/agentController.js';
const router = Router();

router.post('/ask', askAgent);

export default router;