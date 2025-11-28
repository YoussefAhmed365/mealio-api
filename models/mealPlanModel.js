const mongoose = require('mongoose');

// Nested schema for individual ingredients
const ingredientSchema = new mongoose.Schema({
    item: { type: String, required: true },
    measure: { type: String, required: true },
}, { _id: false }); // _id is not needed for subdocuments

// Nested schema for individual meals (e.g., breakfast, lunch)
const mealSchema = new mongoose.Schema({
    meal_name: { type: String, required: true },
    description: { type: String },
    ingredients: [ingredientSchema],
    preparation_steps: [String],
    not_available_ingredients: [String],
}, { _id: false });

// Nested schema for a single day's meals
const dayMealSchema = new mongoose.Schema({
    dayOfWeek: { type: String, required: true },
    meals: [mealSchema],
}, { _id: false });

// Main schema for the entire weekly meal plan
const mealPlanSchema = new mongoose.Schema({
    planId: {
        type: String,
        required: true,
        unique: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User', // Creates a reference to the User model
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    dietaryFocus: [String],
    weeklyMeals: [dayMealSchema],
}, {
    timestamps: true, // Adds createdAt and updatedAt timestamps
});

const MealPlan = mongoose.model('MealPlan', mealPlanSchema);

module.exports = MealPlan;