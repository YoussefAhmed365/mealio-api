import express from 'express';
import {
    sendNotification,
    getNotifications,
    markNotificationAsRead,
    deleteNotification,
    clearAllNotifications
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/send', protect, sendNotification);
router.get('/get', protect, getNotifications);
router.put('/:id/read', protect, markNotificationAsRead);
router.delete('/delete/:id', protect, deleteNotification);
router.delete('/clear-all', protect, clearAllNotifications);

export default router;