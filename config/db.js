import mongoose, { connect } from 'mongoose';

// Define an asynchronous function to connect to the database
const connectDB = async () => {
    // Check if DB is connected
    if (mongoose.connection.readyState === 1) {
        console.log('MongoDB already connected');
        return;
    }

    try {
        // Attempt to connect to MongoDB using the URI from environment variables
        const conn = await connect(process.env.MONGO_URI);

        // Log a success message with the host name if the connection is successful
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        // Log any errors that occur during connection
        console.error(`Error: ${error.message}`);
        // Do NOT call process.exit(1) in serverless environments, as it crashes the entire container,
        // preventing CORS headers from being returned for preflight/failed requests.
    }
};

// Export the connectDB function to be used in other parts of the application
export { connectDB };