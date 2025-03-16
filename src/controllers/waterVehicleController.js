import asyncHandler from "../utils/asyncHandler.js";
import WaterVehicle from "../models/waterVehicle.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";

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
    waterInLitter,
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
  const vehicle = await WaterVehicle.findOne({ phoneNumber: phoneNumber, deleted: false });

  if (!vehicle) return errorResponse(res, "Water vehicle not found", 404);

  return successResponse(res, "Water vehicle retrieved successfully", vehicle);
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


