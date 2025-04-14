import express from 'express';
import { getAdminNotifications, sendUserNotification } from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js'; // Auth middleware

const router = express.Router();

router.get('/admin', getAdminNotifications);
router.post('/', protect, sendUserNotification); // User sends a support notification

export default router;
