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
    receiverEmail: {
        type: String,
        required: true
    }
});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;