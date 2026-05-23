import { GoogleGenAI } from "@google/genai";
import asyncHandler from 'express-async-handler';
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import MealPlan from '../models/mealPlanModel.js';
import MealPreferences from '../models/mealPreferencesSchema.js';

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

// Define Structured Output Schema
const mealPlanZodSchema = z.object({
    planId: z.string().describe("A unique identifier for the plan, e.g., 'weekly-plan-2026-05-12'"),
    startDate: z.string().describe("ISO date string for start"),
    endDate: z.string().describe("ISO date string for end"),
    dietaryFocus: z.array(z.string()).describe("List of dietary goals or focuses"),
    weeklyMeals: z.array(z.object({
        dayOfWeek: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
        meals: z.array(z.object({
            mealName: z.string(),
            description: z.string().optional(),
            ingredients: z.array(z.object({
                item: z.string(),
                measure: z.string(),
            })),
            preparationSteps: z.array(z.string()),
            unavailableIngredients: z.array(z.string()).optional(),
        })),
    })),
});

const mealPlanJsonSchema = zodToJsonSchema(mealPlanZodSchema);

function normalizeMealPlan(raw) {
    if (!raw || typeof raw !== "object") return {};
    
    let data = { ...raw };
    
    // 1. Unwrap from common outer keys
    const outerKeys = ["mealPlan", "meal_plan", "plan", "data"];
    for (const key of outerKeys) {
        if (data[key] && typeof data[key] === "object" && !Array.isArray(data[key])) {
            data = { ...data[key] };
            break;
        }
    }
    
    // 2. Normalize planId, startDate, endDate, dietaryFocus
    const planId = data.planId || data.plan_id || data.id;
    const startDate = data.startDate || data.start_date || data.start;
    const endDate = data.endDate || data.end_date || data.end;
    
    let dietaryFocus = data.dietaryFocus || data.dietary_focus || data.focus || data.dietaryGoals || [];
    if (!Array.isArray(dietaryFocus)) {
        dietaryFocus = typeof dietaryFocus === "string" ? [dietaryFocus] : [];
    }
    
    // 3. Normalize weeklyMeals key
    let weeklyMealsRaw = data.weeklyMeals || data.weekly_meals || data.meals || data.days || data.plan || data.meal_plan || data.mealPlan || [];
    if (!Array.isArray(weeklyMealsRaw) && typeof weeklyMealsRaw === "object") {
        // If it's an object with day keys
        weeklyMealsRaw = Object.keys(weeklyMealsRaw).map(k => ({
            dayOfWeek: k,
            meals: weeklyMealsRaw[k]
        }));
    }
    
    if (!Array.isArray(weeklyMealsRaw)) {
        weeklyMealsRaw = [];
    }
    
    // 4. Process weeklyMeals elements
    const weeklyMeals = weeklyMealsRaw.map(dayRaw => {
        if (!dayRaw || typeof dayRaw !== "object") return null;
        
        // Find dayOfWeek
        let dayOfWeek = dayRaw.dayOfWeek || dayRaw.day_of_week || dayRaw.day;
        if (typeof dayOfWeek === "number" || (typeof dayOfWeek === "string" && !isNaN(parseInt(dayOfWeek, 10)))) {
            const dayIndex = (parseInt(dayOfWeek, 10) - 1) % 7;
            const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            dayOfWeek = dayNames[dayIndex >= 0 ? dayIndex : 0];
        } else if (typeof dayOfWeek === "string") {
            // Capitalize first letter to match enum Monday, Tuesday...
            dayOfWeek = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1).toLowerCase();
        } else {
            dayOfWeek = "Monday"; // fallback
        }
        
        // Validate enum
        const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        if (!validDays.includes(dayOfWeek)) {
            // Try to map from common substrings or fallback
            const foundDay = validDays.find(d => dayOfWeek && typeof dayOfWeek === "string" && d.toLowerCase().includes(dayOfWeek.toLowerCase()));
            dayOfWeek = foundDay || "Monday";
        }
        
        // Find meals
        let mealsRaw = dayRaw.meals || dayRaw.recipes || [];
        if (!Array.isArray(mealsRaw)) {
            mealsRaw = typeof mealsRaw === "object" && Object.keys(mealsRaw).length > 0 ? [mealsRaw] : [];
        }
        
        // If it's flattened, the meal name might be on the day object itself
        if (mealsRaw.length === 0 && (dayRaw.meal || dayRaw.mealName || dayRaw.name || dayRaw.recipe || dayRaw.title)) {
            mealsRaw = [dayRaw];
        }
        
        const meals = mealsRaw.map(mealRaw => {
            if (!mealRaw || typeof mealRaw !== "object") return null;
            
            // Find mealName
            const mealName = mealRaw.mealName || mealRaw.meal_name || mealRaw.name || mealRaw.title || mealRaw.recipeName || "Meal";
            
            // Find description
            const description = mealRaw.description || mealRaw.desc || "";
            
            // Find ingredients
            let ingredientsRaw = mealRaw.ingredients || mealRaw.items || mealRaw.ingredientsList || [];
            if (!Array.isArray(ingredientsRaw)) {
                ingredientsRaw = [];
            }
            
            const ingredients = ingredientsRaw.map(ingRaw => {
                if (!ingRaw) return null;
                if (typeof ingRaw === "string") {
                    return { item: ingRaw, measure: "to taste" };
                }
                const item = ingRaw.item || ingRaw.name || ingRaw.ingredient || ingRaw.food || "Ingredient";
                const measure = ingRaw.measure || ingRaw.amount || ingRaw.quantity || ingRaw.qty || "some";
                return { item, measure };
            }).filter(Boolean);
            
            // Find preparationSteps
            let prepStepsRaw = mealRaw.preparationSteps || mealRaw.preparation_steps || mealRaw.steps || mealRaw.instructions || mealRaw.prepSteps || [];
            if (typeof prepStepsRaw === "string") {
                prepStepsRaw = prepStepsRaw.split('\n').map(s => s.trim()).filter(Boolean);
            }
            if (!Array.isArray(prepStepsRaw)) {
                prepStepsRaw = [];
            }
            const preparationSteps = prepStepsRaw.map(s => String(s));
            
            // Find unavailableIngredients
            let unIngredientsRaw = mealRaw.unavailableIngredients || mealRaw.unavailable_ingredients || mealRaw.missingIngredients || [];
            if (!Array.isArray(unIngredientsRaw)) {
                unIngredientsRaw = typeof unIngredientsRaw === "string" ? [unIngredientsRaw] : [];
            }
            const unavailableIngredients = unIngredientsRaw.map(s => String(s));
            
            return {
                mealName,
                description,
                ingredients,
                preparationSteps,
                unavailableIngredients
            };
        }).filter(Boolean);
        
        return {
            dayOfWeek,
            meals
        };
    }).filter(Boolean);
    
    // 5. Final structure
    const todayStr = new Date().toISOString().split('T')[0];
    const generatedPlanId = planId || `weekly-plan-${todayStr}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    let start = startDate ? new Date(startDate) : null;
    if (!start || isNaN(start.getTime())) {
        start = new Date();
    }
    
    let end = endDate ? new Date(endDate) : null;
    if (!end || isNaN(end.getTime())) {
        end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
    
    return {
        planId: generatedPlanId,
        startDate: start,
        endDate: end,
        dietaryFocus,
        weeklyMeals
    };
}

const askAgent = asyncHandler(async (req, res) => {
    const { prompt, history = [] } = req.body;

    let userContext = "";
    if (req.user) {
        try {
            const prefs = await MealPreferences.findOne({ user: req.user._id });
            if (prefs) {
                let personList = [];
                if (prefs.persons) {
                    prefs.persons.forEach((person) => {
                        const allergies = person.allergies && person.allergies.length > 0 ? person.allergies.join(', ') : 'None';
                        personList.push(`${person.name} (Allergies: ${allergies})`);
                    });
                }
                userContext = `
    
    # User Profile & Preferences
    The user you are talking to has the following saved profile:
    * Dietary Focus: ${prefs.preferences}
    * Budget: ${prefs.budget}
    * Health Tracking: ${prefs.trackingOption}
    * People eating: ${prefs.persons ? prefs.persons.size : 0} [${personList.join(', ')}]
    
    **CRITICAL INSTRUCTION**: You MUST incorporate these preferences into your meal suggestions automatically. Do NOT ask the user for this information again since it is already provided here.`;
            }
        } catch (error) {
            console.error("Error fetching preferences:", error);
        }
    }

    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });

    try {
        // Detect if the user is accepting the plan
        const isAcceptance = /yes|approve|accept|looks good|save it|perfect/i.test(prompt);

        const response = await ai.models.generateContentStream({
            model: "gemma-4-26b-a4b-it",
            contents: [...history, { role: "user", parts: [{ text: prompt }] }],
            config: {
                topP: 0.95,
                temperature: 1.0,
                maxOutputTokens: 16384,
                // If it's an acceptance, we can optionally force JSON, 
                // but let's use the trigger word approach for more flexibility in the stream
                systemInstruction:
                    `
                # Role & Persona
    You are **Meal.io**, the enthusiastic and friendly AI cooking assistant for the "Meal.io" web and mobile app. Your goal is to make cooking an enjoyable, easy, and collaborative experience.${userContext}
    
    **Tone:**
    * Always be warm, encouraging, and collaborative.
    * Use phrases like "Awesome!", "I'm very happy to help!", "That sounds delicious!", and "Enjoy your meal!"
    * Be supportive when discussing dietary restrictions or budget constraints.
    
    # Core Workflow
    You must follow this strictly sequential process. **Do not** provide full recipes until Step 3.
    Start with a short welcome message containing a guided question.
    
    ## Step 1: Menu Proposal & Negotiation
    When a user requests meals (whether for a single meal or a full 7-day week):
    1.  **Analyze Constraints:** specific ingredients available, cultural preferences, number of people, and dietary restrictions.
    2.  **Suggest Titles:** Present a list of meal names with brief descriptions.
        * *Ingredient Check:* If a suggested meal requires ingredients the user *did not* list as available, you MUST list these missing ingredients next to the meal proposal (e.g., *"Requires buying: heavy cream, basil"*).
    3.  **Wait for Approval:** Ask the user if they like these suggestions.
    4.  **Handle Rejection:**
        * If the user rejects specific meals, ask for feedback (e.g., "Too complex?", "Don't like mushrooms?") and replace *only* the rejected items with new suggestions. Keep the accepted ones.
        * Repeat until the user approves the final menu.
    
    ## Step 2: Recipe Generation
    **Only** once the final menu is approved by the user, generate the detailed preparation guides for those specific meals.
    
    # Decision Logic & Constraints
    
    ### 1. Dietary Restrictions & Allergies
    * **Safety First:** If *any* individual in the group has a restriction (e.g., Gluten-Free, Nut Allergy), the suggested meal must be safe for that person, or you must explicitly warn the user.
    * *Example:* If cooking for 4 people and 1 is Gluten-Free, suggest a meal that is naturally Gluten-Free or easily adapted so everyone can eat the same dish.
    
    ### 2. Ingredient Management
    * Prioritize recipes that use the user's *available* ingredients to reduce waste.
    * If the user strictly says "only use what I have," do not suggest recipes requiring a trip to the store.
    
    ### 3. Affordability & Balance (For Weekly Plans)
    * **Meat Limit:** For a 7-day plan, suggest meat-heavy dishes for a maximum of **2 days**.
    * **Innovation:** For the remaining days, focus on innovative, filling, and culturally appropriate vegetarian/plant-based meals to keep costs low.
    
    ### 4. Portion Scaling
    * Always calculate quantities based on the specified number of people.
    
    # Output Format: Detailed Recipe
    When generating the final approved recipes, use this exact structure:
    
    **[Recipe Name]**
    * **Servings:** [Number]
    * **Time:** Prep: [Time] | Cook: [Time]
    * **Ingredients:**
        * [Quantity] [Unit] [Item]
        * ...
    * **Equipment:** [List optional but helpful tools]
    * **Instructions:**
        1.  [Clear, numbered step]
        2.  [Clear, numbered step]
    * **Mealio’s Tips:** [Serving suggestions, storage tips, or flavor hacks]

    # Saving the Plan
    If the user explicitly accepts, approves, or says "Yes" to the proposed meal plan or recipe, you must follow this procedure:
    1. Output exactly one line: "[SAVE_PLAN]"
    2. Immediately follow with a JSON representation of the entire meal plan matching this schema:
    ${JSON.stringify(mealPlanJsonSchema, null, 2)}
    3. Do not include any other text after the JSON.
    
    ---
    **Initial Greeting Example:**
    "Hello! I'm Mealio. I'm ready to help you plan your meals! Tell me what ingredients you have, how many people are eating, and if there are any allergies or cravings I should know about!"
    `,
            }
        });

        let isSaving = false;
        let jsonBuffer = "";

        for await (const chunk of response) {
            if (chunk.text) {
                let text = chunk.text;
                
                if (text.includes('[SAVE_PLAN]')) {
                    isSaving = true;
                    const parts = text.split('[SAVE_PLAN]');
                    // Stream anything before the tag
                    if (parts[0]) res.write(`data: ${JSON.stringify({ text: parts[0] })}\n\n`);
                    jsonBuffer += parts[1] || "";
                    continue;
                }

                if (isSaving) {
                    jsonBuffer += text;
                } else {
                    res.write(`data: ${JSON.stringify({ text: text })}\n\n`);
                }
            }
        }

        if (isSaving) {
            try {
                // Clean up the buffer (sometimes models wrap JSON in markdown blocks)
                const cleanJson = jsonBuffer.replace(/```json|```/g, "").trim();
                console.log("Raw JSON buffer to save:", cleanJson);
                
                // Save the raw response to a debug JSON file in the workspace
                try {
                    const fs = await import('fs/promises');
                    await fs.writeFile('raw_plan_debug.json', cleanJson, 'utf-8');
                    console.log("Wrote debug raw_plan_debug.json successfully");
                } catch (writeErr) {
                    console.error("Failed to write raw_plan_debug.json:", writeErr);
                }

                let planData = JSON.parse(cleanJson);
                
                // Robustly normalize the meal plan fields to align with the schema
                planData = normalizeMealPlan(planData);

                // Save to Database
                await MealPlan.create({
                    ...planData,
                    user: req.user?._id || "64b1f1a2c9e8b2a1d0f1e2b3", // Fallback if no auth yet
                });

                res.write(`data: ${JSON.stringify({ text: "✅ **Success!** Your meal plan has been saved to your account. You can now access your shopping list and prep guides in the 'My Plans' section. Enjoy your cooking!" })}\n\n`);
            } catch (err) {
                console.error("Save error:", err);
                res.write(`data: ${JSON.stringify({ text: "I successfully created the plan but had trouble saving it to your account. You can still see the details above!" })}\n\n`);
            }
        }

        res.write('data: [DONE]\n\n');
        res.end();
    } catch (error) {
        console.error("Agent error:", error);
        res.write(`data: ${JSON.stringify({ error: 'An error occurred while generating the response.' })}\n\n`);
        res.end();
    }
});

export { askAgent };