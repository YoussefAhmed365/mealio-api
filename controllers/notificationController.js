import Notification from "../models/notificationModel.js";
import asyncHandler from "express-async-handler";

// @desc    Send a new notification
// @route   POST /api/notifications/send
// @access  Private
const sendNotification = asyncHandler(async (req, res) => {
    const { title, message, receiverEmail } = req.body;

    const notification = await Notification.create({
        title,
        message,
        receiverEmail,
    });

    if (!notification) {
        res.status(400);
        throw new Error('Invalid notification data');
    }

    res.status(201).json(notification);
});

// @desc    Get all notifications by receiver Email
// @route   GET /api/notifications/get
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
    // Ensure user is authenticated and has an email
    if (!req.user || !req.user.email) {
        res.status(401);
        throw new Error('You have to be logged in first.');
    }

    // Get notifications for the logged-in user only
    const notifications = await Notification.find({ receiverEmail: req.user.email }).sort({ date: -1 });



    res.status(200).json(notifications);
});

// @desc    Delete a notification for receiver Email
// @route   DELETE /api/notifications/delete/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
        res.status(404);
        throw new Error('Notification not found');
    }

    await notification.deleteOne();
    res.status(200).json("Notification deleted successfully");
});

export { sendNotification, getNotifications, deleteNotification };