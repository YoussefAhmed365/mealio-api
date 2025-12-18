import MealPreferences from "../models/mealPreferencesSchema.js";
import User from "../models/userModel.js";
import asyncHandler from "express-async-handler";

// @desc    Save meals preferences
// @route   POST /api/meal-preferences
// @access  Private - Authenticated users only
const saveMealPreferences = asyncHandler(async (req, res) => {
    const { preferences, persons, budget, trackingOption } = req.body;

    if (!preferences || !persons || !budget || !trackingOption) {
        res.status(400);
        throw new Error("Please add all required fields");
    }

    // Create the meal preferences
    const mealPreferences = await MealPreferences.create({
        preferences,
        persons,
        budget,
        trackingOption,
        user: req.user._id,
    });

    // Link the preferences to the user
    const user = await User.findById(req.user._id);
    user.mealPreferences = mealPreferences._id;
    await user.save();

    // Return the updated user with preferences populated
    // We re-fetch or just modify the user object. 
    // Best practice: return the user structure that matches the login/profile response
    const updatedUser = await User.findById(req.user._id).select('-password').populate('mealPreferences');

    res.status(201).json(updatedUser);
});

// @desc    Update meals preferences
// @route   PUT /api/meal-preferences
// @access  Private - Authenticated users only
const updateMealPreferences = asyncHandler(async (req, res) => {
    const { preferences, persons, budget, trackingOption } = req.body;

    // Find the existing preferences
    // We can assume req.user.mealPreferences exists or find by user field
    let mealPreferences = await MealPreferences.findOne({ user: req.user._id });

    if (!mealPreferences) {
        // Fallback: if not found, create it (essentially logic from save)
        mealPreferences = await MealPreferences.create({
            preferences,
            persons,
            budget,
            trackingOption,
            user: req.user._id,
        });

        const user = await User.findById(req.user._id);
        user.mealPreferences = mealPreferences._id;
        await user.save();
    } else {
        // Update fields
        mealPreferences.preferences = preferences || mealPreferences.preferences;
        mealPreferences.persons = persons || mealPreferences.persons;
        mealPreferences.budget = budget || mealPreferences.budget;
        mealPreferences.trackingOption = trackingOption || mealPreferences.trackingOption;

        await mealPreferences.save();
    }

    // Return the updated user
    const updatedUser = await User.findById(req.user._id).select('-password').populate('mealPreferences');

    res.status(200).json(updatedUser);
});

export { saveMealPreferences, updateMealPreferences };