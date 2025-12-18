// Import required packages
import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { connectDB } from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import userRoutes from './routes/userRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import mealPreferencesRoutes from './routes/mealPreferencesRoutes.js';
import mealPlanRoutes from './routes/mealPlanRoutes.js';

// Load environment variables from .env file
dotenv.config();

// Connect to the MongoDB database
connectDB();

// Initialize the Express application
const app = express();

// Use cookie-parser middleware to parse cookies
app.use(cookieParser());

// Enable Cross-Origin Resource Sharing (CORS) for all routes
app.use(cors({
    origin: 'http://localhost:5173', // React App Port
    credentials: true,
}));

// Use express.json() middleware to parse incoming JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use the user routes
app.use('/api/users', userRoutes);

// Use the notification routes
app.use('/api/notifications', notificationRoutes);

// Use the meal preferences routes
app.use('/api/meal-preferences', mealPreferencesRoutes);

// Use the meal plan routes
app.use('/api/meal-plans', mealPlanRoutes);

app.get('/', (_req, res) => { res.send('Server is Ready.') });

// Use the error handling middleware
app.use(notFound);
app.use(errorHandler);

// Define the port for the server to listen on
// Use the port from environment variables, or default to 5000
const PORT = process.env.PORT || 5000;

// Start the server and listen for connections on the specified port
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});