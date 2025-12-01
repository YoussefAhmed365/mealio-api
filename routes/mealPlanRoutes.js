import express from 'express';
const router = express.Router();
import {
    createMealPlan,
    getMyMealPlans,
} from '../controllers/mealPlanController.js';
import { protect } from '../middleware/authMiddleware.js';

router.route('/').post(protect, createMealPlan);
router.route('/myplans').get(protect, getMyMealPlans);

export default router;