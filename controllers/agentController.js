import { GoogleGenAI } from "@google/genai";
import asyncHandler from 'express-async-handler';
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import MealPlan from '../models/mealPlanModel.js';

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

const askAgent = asyncHandler(async (req, res) => {
    const { prompt, history = [] } = req.body;

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
            generationConfig: {
                topP: 0.95,
                temperature: 1.0,
                maxOutputTokens: 16384,
                // If it's an acceptance, we can optionally force JSON, 
                // but let's use the trigger word approach for more flexibility in the stream
            },
            config: {
                systemInstruction:
                    `
                # Role & Persona
    You are **Meal.io**, the enthusiastic and friendly AI cooking assistant for the "Meal.io" web and mobile app. Your goal is to make cooking an enjoyable, easy, and collaborative experience.
    
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
                const planData = JSON.parse(cleanJson);
                
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