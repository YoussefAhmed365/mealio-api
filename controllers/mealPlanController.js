import MealPlan from '../models/mealPlanModel.js';
import { v4 as uuidv4 } from 'uuid';
import asyncHandler from 'express-async-handler';

// @desc    Create a new meal plan
// @route   POST /api/mealplans
// @access  Private
const createMealPlan = asyncHandler(async (req, res) => {
    const { startDate, endDate, dietaryFocus, weeklyMeals } = req.body;

    if (!weeklyMeals || weeklyMeals.length === 0) {
        res.status(400);
        throw new Error('No meal items');
    }

    // Generate a unique planId
    const planId = `plan_${uuidv4()}_user_${req.user._id}`;


    const mealPlan = new MealPlan({
        user: req.user._id,
        planId,
        startDate,
        endDate,
        dietaryFocus,
        weeklyMeals,
    });

    const createdMealPlan = await mealPlan.save();
    res.status(201).json(createdMealPlan);
});

// @desc    Get logged in user's meal plans
// @route   GET /api/mealplans/myplans
// @access  Private
const getMyMealPlans = asyncHandler(async (req, res) => {
    const mealPlans = await MealPlan.find({ user: req.user._id });
    res.json(mealPlans);
});

export { createMealPlan, getMyMealPlans };