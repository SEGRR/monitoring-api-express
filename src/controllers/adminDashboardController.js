import asyncHandler from "../utils/asyncHandler.js";
import Device from "../models/device-metadata.js";
import SensorData from "../models/sensorDataModel.js";
import User from "../models/userModel.js";
import Notification from "../models/notificationsModel.js";
import { errorResponse, successResponse } from "../utils/responseHandler.js";

// @desc    Get Admin KPI Dashboard values
// @route   GET /api/admin-dashboard/kpis
// @access  Private (Admin)


export const getAdminKpis = asyncHandler(async (req, res) => {
  // Total registered devices
  const totalDevices = await Device.countDocuments();

  // Active devices (last 24 hours)
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const activeDevicesAgg = await SensorData.aggregate([
    {
      $match: { timestamp: { $gte: last24Hours } }
    },
    {
      $group: {
        _id: { productId: "$productId", slaveId: "$slaveId" }
      }
    },
    {
      $count: "activeCount"
    }
  ]);
  const activeDevices = activeDevicesAgg[0]?.activeCount || 0;

  // Devices in DB but not in registered devices
  const dbDevices = await SensorData.aggregate([
    {
      $group: {
        _id: "$productId"
      }
    }
  ]);
  const dbDeviceIds = dbDevices.map(d => d._id);

  const registeredDevices = await Device.distinct("productId");

  const unregisteredDevices = dbDeviceIds.filter(
    id => !registeredDevices.includes(id)
  );

  // Total users/admins
  const totalUsers = await User.countDocuments() - 1; // exclude the Master Admin

  return res.status(200).json({
    success: true,
    message: "Admin KPIs retrieved successfully",
    data: {
      totalDevices,
      activeDevices,
      unregisteredDevicesCount: unregisteredDevices.length,
      totalUsers
    }
  });
});


export const getTodayDeviceFlow = async (req, res) => {
    try {
      const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
      const endOfDay = new Date();  // current time 
  
      const result = await SensorData.aggregate([
        {
          $match: {
            timestamp: { $gte: startOfDay, $lte: endOfDay }
          }
        },
        {
          $sort: { timestamp: 1 }
        },
        {
          $group: {
            _id: "$productId",
            totalFlowStart: { $first: "$totalFlow" },
            totalFlowEnd: { $last: "$totalFlow" },
            deviceLabel: { $last: "$deviceLabel" },
            lastSeen: { $last: "$timestamp" }
          }
        },
        {
          $project: {
            _id: 0,
            productId: "$_id",
            deviceLabel: 1,
            totalFlow: {
              $round: [
                { $subtract: ["$totalFlowEnd", "$totalFlowStart"] },
                2
              ]
            },
            lastSeen: 1
          }
        },
        {
          $sort: { totalFlow: -1 }
        }
      ]);
  
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      console.error('Error fetching today’s device flow:', err);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  };


  export const getUnregisteredDevices = async (req, res) => {
    try {
      // Step 1: Get all productIds from sensor data
      const productIdsInData = await SensorData.distinct('productId');
  
      // Step 2: Get all registered productIds
      const registeredProductIds = await Device.distinct('productId');
  
      // Step 3: Filter productIds present in data but not registered
      const unregisteredProductIds = productIdsInData.filter(
        id => !registeredProductIds.includes(id)
      );
  
      // Step 4: Get the latest frame (lastSeen) for each unregistered productId
      const unregisteredDevices = await SensorData.aggregate([
        {
          $match: { productId: { $in: unregisteredProductIds } }
        },
        {
          $sort: { timestamp: -1 }
        },
        {
          $group: {
            _id: "$productId",
            lastSeen: { $first: "$timestamp" },
            deviceLabel: { $first: "$deviceLabel" },
            slaveId: { $first: "$slaveId" }
          }
        },
        {
          $project: {
            _id: 0,
            productId: "$_id",
            lastSeen: 1,
            deviceLabel: 1,
            slaveId: 1
          }
        },
        {
          $sort: { lastSeen: -1 }
        }
      ]);
  
      res.status(200).json({ success: true, data: unregisteredDevices });
    } catch (err) {
      console.error('Error fetching unregistered devices:', err);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  };

  export const getNewUsers = async (req, res) => {
    try {
      // Get optional query parameter for days (e.g., last 7 days)
      const days = parseInt(req.query.days) || 7;
  
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);
  
      const newUsers = await User.find({ registeredOn: { $gte: fromDate } })
        .sort({ registeredOn: -1 })
        .select('name email role createdAt');
  
      res.status(200).json({
        success: true,
        count: newUsers.length,
        data: newUsers
      });
    } catch (error) {
      console.error('Error fetching new users:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  };


  export const getAdminNotificationSummary = asyncHandler(async (req, res) => {
    const { isRead = 'false' } = req.query;
  
    const notifications = await Notification.find({
      userRole: 'admin',
      isRead: isRead === 'true',
    })
      .populate('sender', 'name email')
      .sort({ timestamp: -1 })
      .select('message sender timestamp');
  
    res.status(200).json({ success: true, data: notifications });
  });