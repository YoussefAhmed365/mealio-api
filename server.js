// Import required packages
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware.js');
const mealPlanRoutes = require('./routes/mealPlanRoutes.js');
const userRoutes = require('./routes/userRoutes.js');

// Load environment variables from .env file
dotenv.config();

// Connect to the MongoDB database
connectDB();

// Initialize the Express application
const app = express();

// Enable Cross-Origin Resource Sharing (CORS) for all routes
app.use(cors());

// Use express.json() middleware to parse incoming JSON requests
app.use(express.json());

// Define a simple route for the root URL
app.get('/', (req, res) => {
    res.send('Welcome to the Meal.io API!');
});

// Use the meal plan routes
app.use('/api/mealplans', mealPlanRoutes);
// Use the user routes
app.use('/api/users', userRoutes);

// Use the error handling middleware
app.use(notFound);
app.use(errorHandler);

// Define the port for the server to listen on
// Use the port from environment variables, or default to 5000
const PORT = process.env.PORT || 5000;

// Start the server and listen for connections on the specified port
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
