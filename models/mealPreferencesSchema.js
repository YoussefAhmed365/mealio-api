import mongoose from "mongoose";

const mealPreferencesSchema = new mongoose.Schema({
    preferences: {
        type: String,
        required: true,
        enum: [
            "No Preference", 
            "Vegetarian", 
            "Vegan", 
            "Pescatarian", 
            "Keto", 
            "Paleo", 
            "Gluten-Free"
        ]
    },
    persons: {
        type: Map,
        of: new mongoose.Schema({
            name: {
                type: String,
                default: 'Person'
            },
            allergies: {
                type: [String],
                default: []
            }
        }, { _id: false }),
        required: true,
        validate: [
            {
                validator: (val) => val.size >= 1 && val.size <= 10,
                msg: 'Number of people must be between 1 and 10'
            }
        ]
    },
    budget: {
        type: String,
        required: true,
        enum: ["Low", "Medium", "High", "No Limit"]
    },
    trackingOption: {
        type: String,
        required: true,
        enum: [
            "Track Calories", 
            "Track Macros", 
            "Track Ingredients", 
            "No Tracking"
        ]
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const MealPreferences = mongoose.model('MealPreferences', mealPreferencesSchema);

export default MealPreferences;