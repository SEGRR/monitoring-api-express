import asyncHandler from "../utils/asyncHandler.js";
import WaterVehicle from "../models/waterVehicle.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";
import SensorData from "../models/sensorDataModel.js";
import mongoose from "mongoose";

// ✅ Create Water Vehicle
export const createWaterVehicle = asyncHandler(async (req, res) => {
  const { phoneNumber, deviceId, slaveId, startTime, endTime, vehicleNo, waterInLitter, geoLat, geoLong, placeName } = req.body;
  const vehiclePhoto = req.file?.path; // Already handled by multer middleware

  const newVehicle = await WaterVehicle.create({
    phoneNumber,
    deviceId,
    slaveId,
    startTime,
    endTime,
    vehicleNo,
    waterInLitres:parseInt(waterInLitter),
    geoLat,
    geoLong,
    placeName,
    vehiclePhoto,
  });

  return successResponse(res,newVehicle, "Water vehicle created successfully");
});

// ✅ Get All Water Vehicles (Excludes Soft Deleted)
export const getAllWaterVehicles = asyncHandler(async (req, res) => {
  const vehicles = await WaterVehicle.find({ deleted: false });
  return successResponse(res, vehicles, "Water vehicles retrieved successfully", );
});

// ✅ Get Water Vehicle by ID
export const getWaterVehicleById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vehicle = await WaterVehicle.findOne({ _id: id, deleted: false });

  if (!vehicle) return errorResponse(res, "Water vehicle not found", 404);

  return successResponse(res, "Water vehicle retrieved successfully", vehicle);
});

// ✅ Get Water Vehicle by ID
export const getWaterVehicleByPhoneNumber = asyncHandler(async (req, res) => {
  const { phoneNumber } = req.params;
  const vehicle = await WaterVehicle.find({ phoneNumber: phoneNumber, deleted: false });

  if (!vehicle) return errorResponse(res, "Water vehicle not found", 404);

  return successResponse(res, vehicle,"Water vehicle retrieved successfully", );
});
// ✅ Update Water Vehicle
export const updateWaterVehicle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateFields = { ...req.body };

  if (req.file) updateFields.vehiclePhoto = req.file.path;

  const updatedVehicle = await WaterVehicle.findOneAndUpdate(
    { _id: id, deleted: false },
    updateFields,
    { new: true }
  );

  if (!updatedVehicle) return errorResponse(res, "Water vehicle not found", 404);

  return successResponse(res, "Water vehicle updated successfully", updatedVehicle);
});

// ✅ Soft Delete Water Vehicle
export const deleteWaterVehicle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deletedVehicle = await WaterVehicle.findOneAndUpdate(
    { _id: id, deleted: false },
    { deleted: true },
    { new: true }
  );

  if (!deletedVehicle) return errorResponse(res, "Water vehicle not found", 404);

  return successResponse(res, "Water vehicle deleted successfully");
});


export const analyzeSingleVehicleFlow = asyncHandler(async (req, res) => {
  const { vehicleId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
    return errorResponse(res, 'Invalid vehicleId',400);
  }

  const vehicle = await WaterVehicle.findById(vehicleId);
   console.log(vehicle)
  if (!vehicle) {
    return errorResponse(res, 'Water vehicle entry not found',400);

  }

  const { deviceId, slaveId, startTime, endTime } = vehicle;

  const aggregation = await SensorData.aggregate([
    {
      $match: {
        productId:deviceId,
        slaveId:parseInt(slaveId),
        timestamp: { $gte: startTime, $lte: endTime },
      },
    },
    { $sort: { timestamp: 1 } },
    {
      $group: {
        _id: null,
        startTime: { $first: '$timestamp' },
        endTime: { $last: '$timestamp' },
        totalFlowAtStart: { $first: '$totalFlow' },
        totalFlowAtEnd: { $last: '$totalFlow' },
        readings: { $push: '$$ROOT' },
      },
    },
    {
      $project: {
        _id: 0,
        vehicleId,
        productId:deviceId,
        slaveId:parseInt(slaveId),
        startTime: 1,
        endTime: 1,
        durationMinutes: {
          $round: [
            {
              $divide: [{ $subtract: ['$endTime', '$startTime'] }, 1000 * 60],
            },
            2,
          ],
        },
        totalWaterFlow: {
          $round: [
            { $subtract: ['$totalFlowAtEnd', '$totalFlowAtStart'] },
            2,
          ],
        },
        readings: 1,
      },
    },
    {
      $addFields: {
        flowRates: {
          $map: {
            input: { $range: [1, { $size: '$readings' }] },
            as: 'i',
            in: {
              $let: {
                vars: {
                  prev: { $arrayElemAt: ['$readings', { $subtract: ['$$i', 1] }] },
                  curr: { $arrayElemAt: ['$readings', '$$i'] },
                },
                in: {
                  $cond: [
                    {
                      $gt: [
                        {
                          $subtract: [
                            { $toLong: '$$curr.timestamp' },
                            { $toLong: '$$prev.timestamp' },
                          ],
                        },
                        0,
                      ],
                    },
                    {
                      $divide: [
                        {
                          $subtract: ['$$curr.totalFlow', '$$prev.totalFlow'],
                        },
                        {
                          $divide: [
                            {
                              $subtract: [
                                { $toLong: '$$curr.timestamp' },
                                { $toLong: '$$prev.timestamp' },
                              ],
                            },
                            1000,
                          ],
                        },
                      ],
                    },
                    0,
                  ],
                },
              },
            },
          },
        },
      },
    },
    {
      $project: {
        vehicleId: 1,
        productId: 1,
        slaveId: 1,
        startTime: 1,
        endTime: 1,
        durationMinutes: 1,
        totalWaterFlow: 1,
        averageFlowRate: {
          $round: [{ $avg: '$flowRates' }, 2],
        },
        maxFlowRate: {
          $round: [{ $max: '$flowRates' }, 2],
        },
        minFlowRate: {
          $round: [{ $min: '$flowRates' }, 2],
        },
      },
    },
  ]);
   
  console.log(aggregation)
  // if (!aggregation.length) {
  //   return errorResponse(res, 'No sensor data found for this vehicle entry', 404);
  // }

   return successResponse(res,aggregation ,'Vehicle water flow analysis completed successfully.');
});