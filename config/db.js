// Import mongoose for MongoDB interaction
const mongoose = require('mongoose');

// Define an asynchronous function to connect to the database
const connectDB = async () => {
    try {
        // Attempt to connect to MongoDB using the URI from environment variables
        const conn = await mongoose.connect(process.env.MONGO_URI);

        // Log a success message with the host name if the connection is successful
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        // Log any errors that occur during connection
        console.error(`Error: ${error.message}`);
        // Exit the process with a failure code if connection fails
        process.exit(1);
    }
};

// Export the connectDB function to be used in other parts of the application
module.exports = connectDB;