import Notification from "../models/notificationModel.js";
import asyncHandler from "express-async-handler";

// @desc    Send a new notification
// @route   POST /api/notifications/send
// @access  Private
const sendNotification = asyncHandler(async (req, res) => {
    const { title, message, recipient } = req.body;

    // Use the provided recipient ID (should be an ObjectId string)
    // In a real scenario, you might validate that this User exists.
    // For now, we trust the sender (system/AI) provides a valid ID.

    const notification = await Notification.create({
        title,
        message,
        recipient, // Expecting User ID
    });

    if (!notification) {
        res.status(400);
        throw new Error('Invalid notification data');
    }

    res.status(201).json(notification);
});

// @desc    Get all notifications for logged in user
// @route   GET /api/notifications/get
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
    if (!req.user || !req.user._id) {
        res.status(401);
        throw new Error('Not authorized');
    }

    const notifications = await Notification.find({ recipient: req.user._id }).sort({ date: -1 });

    res.status(200).json(notifications);
});

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markNotificationAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
        res.status(404);
        throw new Error('Notification not found');
    }

    // Ensure the notification belongs to the logged-in user
    if (notification.recipient.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized to access this notification');
    }

    notification.read = true;
    notification.readAt = Date.now();
    await notification.save();

    res.status(200).json(notification);
});

// @desc    Delete a notification
// @route   DELETE /api/notifications/delete/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
        res.status(404);
        throw new Error('Notification not found');
    }

    // Ensure the notification belongs to the logged-in user
    if (notification.recipient.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized to delete this notification');
    }

    await notification.deleteOne();
    res.status(200).json({ message: "Notification deleted successfully" });
});

// @desc    Clear all notifications for the logged-in user
// @route   DELETE /api/notifications/clear-all
// @access  Private
const clearAllNotifications = asyncHandler(async (req, res) => {
    if (!req.user || !req.user._id) {
        res.status(401);
        throw new Error('Not authorized');
    }

    await Notification.deleteMany({ recipient: req.user._id });
    res.status(200).json({ message: "All notifications cleared" });
});

export {
    sendNotification,
    getNotifications,
    markNotificationAsRead,
    deleteNotification,
    clearAllNotifications
};