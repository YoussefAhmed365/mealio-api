import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    message: String,
    date: {
        type: Date,
        default: Date.now
    },
    read: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date,
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

// Create a TTL index on the readAt field
// Documents will expire 24 hours (86400 seconds) after the readAt time
notificationSchema.index({ readAt: 1 }, { expireAfterSeconds: 86400 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;