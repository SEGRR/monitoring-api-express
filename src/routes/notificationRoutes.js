import express from 'express';
import { getAdminNotifications, sendUserNotification, sendNotificationById, getAllNotifications } from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js'; // Auth middleware

const router = express.Router();

router.get('/admin', getAdminNotifications);
router.get('/',getAllNotifications)
router.post('/', protect, sendUserNotification); // User sends a support notification
router.get('/:id', sendNotificationById)
export default router;
