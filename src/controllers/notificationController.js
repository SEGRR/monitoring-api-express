import Notification from '../models/notificationsModel.js';
import asyncHandler from '../utils/asyncHandler.js';
import { errorResponse, successResponse } from "../utils/responseHandler.js";

// @desc    Send a notification from user
// @route   POST /api/notifications/send
// @access  Private
export const sendUserNotification = asyncHandler(async (req, res) => {
    const { message , productId } = req.body;
    const sender = req.user._id;
  
    const notification = new Notification({
      message,
      sender,
      userRole: 'admin',
      isRead: false,
      timestamp: new Date(),
      productId
    });
  
    await notification.save();
    
    successResponse(res  , {message}, "notifications sent successfully")
  });
  
  // @desc    Get admin notifications (optionally filter by isRead)
  // @route   GET /api/notifications/admin?isRead=false
  // @access  Private (Admin)
  export const getAdminNotifications = asyncHandler(async (req, res) => {
    const { isRead } = req.query;
    const query = { userRole: 'admin' };
  
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }
  
    const notifications = await Notification.find(query)
      .populate('sender', 'name email')
      .sort({ timestamp: -1 });
    
      successResponse(res , notifications , "notifications retrived successfully")
    // res.status(200).json({ success: true, data: notifications });
  });