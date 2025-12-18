import express from 'express';
import { saveMealPreferences, updateMealPreferences } from '../controllers/mealPreferencesController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router
    .route('/')
    .post(protect, saveMealPreferences)
    .put(protect, updateMealPreferences);

export default router;