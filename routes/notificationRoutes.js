import express from 'express';
import { sendNotification, getNotifications, deleteNotification } from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';
const router = express.Router();

router.post('/send', protect, sendNotification);
router.get('/get', protect, getNotifications);
router.delete('/delete/:id', protect, deleteNotification);

export default router;