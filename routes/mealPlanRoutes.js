const express = require('express');
const router = express.Router();
const {
    createMealPlan,
    getMyMealPlans,
} = require('../controllers/mealPlanController.js');
const { protect } = require('../middleware/authMiddleware.js');

router.route('/').post(protect, createMealPlan);
router.route('/myplans').get(protect, getMyMealPlans);

module.exports = router;
