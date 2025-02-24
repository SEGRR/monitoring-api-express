import Device from '../models/device-metadata.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';
import User from '../models/userModel.js';
// ✅ Get all devices (with pagination)
export const getAllDevices = asyncHandler(async (req, res) => {
    let { page, limit } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;

    const devices = await Device.find({ deleted: false }).skip(skip).limit(limit);
    const totalDevices = await Device.countDocuments({ deleted: false });

    return successResponse(res, {
        devices,
        totalPages: Math.ceil(totalDevices / limit),
        currentPage: page,
        totalDevices
    }, "Devices retrieved successfully", 200);
});

// ✅ Get a single device by productId
export const getDeviceById = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const device = await Device.findOne({ productId, deleted: false });

    if (!device) {
        return errorResponse(res, "Device not found", 404);
    }
    return successResponse(res, device, "Device retrieved successfully", 200);
});

// ✅ Create a new device (check for duplicate ProductId)
export const createDevice = asyncHandler(async (req, res) => {
    const { productId, serialNumber } = req.body;

    // Check if device with the same productId exists
    const existingDevice = await Device.findOne({ productId });
    if (existingDevice) {
        return errorResponse(res, "Product ID already exists", 400);
    }

    const device = new Device(req.body);
    await device.save();
    return successResponse(res, device, "Device created successfully", 201);
});

// ✅ Update a device (Only update provided fields, add lastUpdated)
export const updateDevice = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const updates = req.body;

    updates.lastUpdated = new Date();

    const updatedDevice = await Device.findOneAndUpdate(
        { productId, deleted: false },
        { $set: updates },
        { new: true, runValidators: true }
    );

    if (!updatedDevice) {
        return errorResponse(res, "Device not found", 404);
    }

    return successResponse(res, updatedDevice, "Device updated successfully", 200);
});

// ✅ Soft delete a device (set deleted = true)
export const deleteDevice = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const updatedDevice = await Device.findOneAndUpdate(
        { productId, deleted: false },
        { $set: { deleted: true } },
        { new: true }
    );

    if (!updatedDevice) {
        return errorResponse(res, "Device not found or already deleted", 404);
    }

    return successResponse(res, null, "Device marked as deleted", 200);
});




// ✅ Add a slave device (check for duplicate slaveId)
export const addSlaveDevice = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const newSlave = req.body;

    const device = await Device.findOne({ productId, deleted: false });

    if (!device) {
        return errorResponse(res, "Device not found", 404);
    }

    const existingSlave = device.slaveDevices.find(
        (slave) => slave.slaveId === newSlave.slaveId && !slave.deleted
    );

    if (existingSlave) {
        return errorResponse(res, "Slave ID already exists", 400);
    }

    newSlave.deleted = false;
    device.slaveDevices.push(newSlave);
    await device.save();

    return successResponse(res, newSlave, "Slave device added successfully", 201);
});

// ✅ Update a slave device (only update provided fields)
export const updateSlaveDevice = asyncHandler(async (req, res) => {
    const { productId, slaveId } = req.params;
    const updates = req.body;

    const device = await Device.findOne({ productId, deleted: false });

    if (!device) {
        return errorResponse(res, "Device not found", 404);
    }

    const slaveIndex = device.slaveDevices.findIndex(
        (slave) => slave.slaveId === slaveId && !slave.deleted
    );

    if (slaveIndex === -1) {
        return errorResponse(res, "Slave device not found", 404);
    }

    // Update only provided fields
    Object.assign(device.slaveDevices[slaveIndex], updates);
    device.slaveDevices[slaveIndex].lastUpdated = new Date();

    await device.save();

    return successResponse(res, device.slaveDevices[slaveIndex], "Slave device updated successfully", 200);
});

// ✅ Soft delete a slave device (set deleted = true)
export const deleteSlaveDevice = asyncHandler(async (req, res) => {
    const { productId, slaveId } = req.params;

    const device = await Device.findOne({ productId, deleted: false });

    if (!device) {
        return errorResponse(res, "Device not found", 404);
    }

    const slaveIndex = device.slaveDevices.findIndex(
        (slave) => slave.slaveId === slaveId && !slave.deleted
    );

    if (slaveIndex === -1) {
        return errorResponse(res, "Slave device not found", 404);
    }

    device.slaveDevices[slaveIndex].deleted = true;
    await device.save();

    return successResponse(res, null, "Slave device marked as deleted", 200);
});

// ✅ Get a single slave device by slaveId
export const getSlaveDeviceById = asyncHandler(async (req, res) => {
    const { productId, slaveId } = req.params;

    const device = await Device.findOne({ productId, deleted: false });

    if (!device) {
        return errorResponse(res, "Device not found", 404);
    }

    const slave = device.slaveDevices.find(
        (slave) => slave.slaveId === slaveId && !slave.deleted
    );

    if (!slave) {
        return errorResponse(res, "Slave device not found", 404);
    }

    return successResponse(res, slave, "Slave device retrieved successfully", 200);
});

// ✅ Get all slave devices of a specific device
export const getSlaveDevices = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const device = await Device.findOne({ productId, deleted: false });

    if (!device) {
        return errorResponse(res, "Device not found", 404);
    }

    const activeSlaves = device.slaveDevices.filter(slave => !slave.deleted);

    return successResponse(res, activeSlaves, "Slave devices retrieved successfully", 200);
});

export const assignDeviceToUser = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    const { productId } = req.params; // Product ID from query parameter

    // Validate request
    if (!userId || !productId) {
        return errorResponse(res, "userId and productId are required", 400);
    }

    // ✅ Check if the user exists and is not soft-deleted
    const user = await User.findOne({ _id: userId, deleted: { $ne: true } });
    if (!user) {
        return errorResponse(res, "User not found or deleted", 404);
    }

    // ✅ Check if the device exists
    const device = await Device.findOne({ productId });
    if (!device) {
        return errorResponse(res, "Device not found", 404);
    }

    // ✅ Check if the device is already assigned
    if (user.deviceList.includes(productId)) {
        return errorResponse(res, "Device is already assigned to the user", 400);
    }

    // ✅ Add device to user's deviceList
    user.deviceList.push(productId);
    await user.save();

    return successResponse(res, user, "Device assigned successfully", 200);
});

export const getDevicesByProductIds = asyncHandler(async (req, res) => {
    const { deviceList } = req.body;

    if (!deviceList || !Array.isArray(deviceList) || deviceList.length === 0) {
        return errorResponse(res, "deviceList must be a non-empty array", 400);
    }

    const devices = await Device.find({ productId: { $in: deviceList }, deleted: { $ne: true } });

    return successResponse(res, devices, "Devices retrieved successfully", 200);
});