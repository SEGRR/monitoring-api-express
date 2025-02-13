import Device from '../models/device-metadata.js';
import { successResponse, errorResponse } from '../utils/response.js';

// Create a new device
export const createDevice = async (req, res) => {
    try {
        // cheking if device exists
        const existingDevice = await Device.findOne({ productId: req.body.productId });
        if (existingDevice) {
            return errorResponse(res, "Device with this Product ID already exists", 400);
        }
        let newDevice = {...req.body , installDate:new Date() , enabled:true , active:true};

        const device = await Device.create(newDevice);
        return successResponse(res, device, "Device created successfully", 201);
    } catch (error) {
        return errorResponse(res, error.message, 400);
    }
};

// Get all devices
export const getAllDevices = async (req, res) => {
    try {
        // Retrieve only devices where deleted is false
        const devices = await Device.find({ deleted: false });

        return successResponse(res, devices, "Devices retrieved successfully", 200);
    } catch (error) {
        return errorResponse(res, error.message, 400);
    }
};

// Get device by ID
export const getDeviceById = async (req, res) => {
    try {
        const device = await Device.findOne({productId:req.params.productId});
        if (!device) return errorResponse(res, "Device not found", 404);
        return successResponse(res, device, "Device retrieved successfully");
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

// Update device
export const updateDevice = async (req, res) => {
    //TODO: if updating productId need to check if conflicts with any other 
    try {
        const { productId } = req.params; // Get productId from URL

        // Find the device by productId
        const device = await Device.findOne({ productId });
        if (!device) {
            return errorResponse(res, "Device not found", 404);
        }

        // Update only the fields present in req.body
        Object.keys(req.body).forEach(key => {
            device[key] = req.body[key];
        });

        // Add the lastUpdated timestamp
        device.lastUpdated = new Date();
        device.__v +=1

        // Save the updated device
        await device.save();

        return successResponse(res, device, "Device updated successfully", 200);
    } catch (error) {
        return errorResponse(res, error.message, 400);
    }
};

// Delete device
export const deleteDevice = async (req, res) => {
    try {
        const { productId } = req.params; // Get productId from URL

        // Find the device
        const device = await Device.findOne({ productId });
        if (!device) {
            return errorResponse(res, "Device not found", 404);
        }
        // Mark as deleted
        device.deleted = true;
        device.lastUpdated = new Date();
        device.__v += 1
        await device.save();

        return successResponse(res, null, "Device is Successfully deleted", 200);
    } catch (error) {
        return errorResponse(res, error.message, 400);
    }
};

export const addSlaveDevice = async (req, res) => {
    try {
        const { productId } = req.params;
        const newSlave = req.body;

        // Find the device by productId (excluding soft-deleted devices)
        const device = await Device.findOne({ productId, deleted: false });

        if (!device) {
            return errorResponse(res, "Device not found", 404);
        }

        // Check if slaveId already exists (excluding soft-deleted slaves)
        const existingSlave = device.slaveDevices.find(
            (slave) => slave.slaveId === newSlave.slaveId && !slave.deleted
        );

        if (existingSlave) {
            return errorResponse(res, "Slave ID already exists", 400);
        }

        // Add the new slave with deleted: false by default
        newSlave.deleted = false;
        device.slaveDevices.push(newSlave);
        await device.save();

        return successResponse(res, newSlave, "Slave device added successfully", 201);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};


export const updateSlaveDevice = async (req, res) => {
    try {
        const { productId, slaveId } = req.params;
        const updateData = req.body;

        const device = await Device.findOne({ productId, deleted: false });
        if (!device) {
            return errorResponse(res, "Device not found", 404);
        }

        // Find the slave device by slaveId
        const slaveDevice = device.slaveDevices.find(slave => slave.slaveId === slaveId && !slave.deleted);
        if (!slaveDevice) {
            return errorResponse(res, "Slave device not found", 404);
        }

        // Update only provided fields
        Object.keys(updateData).forEach(key => {
            slaveDevice[key] = updateData[key];
        });

        slaveDevice.lastUpdated = new Date();
        await device.save();

        return successResponse(res, device, "Slave device updated successfully", 200);
    } catch (error) {
        return errorResponse(res, error.message, 400);
    }
};


export const deleteSlaveDevice = async (req, res) => {
    try {
        const { productId, slaveId } = req.params;

        const device = await Device.findOne({ productId, deleted: false });
        if (!device) {
            return errorResponse(res, "Device not found", 404);
        }

        // Find the slave device by slaveId
        const slaveDevice = device.slaveDevices.find(slave => slave.slaveId === slaveId && !slave.deleted);
        if (!slaveDevice) {
            return errorResponse(res, "Slave device not found", 404);
        }

        slaveDevice.deleted = true;
        device.lastUpdated = new Date();

        await device.save();

        return successResponse(res, null, "Slave device marked as deleted", 200);
    } catch (error) {
        return errorResponse(res, error.message, 400);
    }
};


export const getSlaveDevices = async (req, res) => {
    try {
        const { productId } = req.params;

        const device = await Device.findOne({ productId, deleted: false });
        if (!device) {
            return errorResponse(res, "Device not found", 404);
        }

        // Filter out deleted slave devices
        const activeSlaveDevices = device.slaveDevices.filter(slave => !slave.deleted);

        return successResponse(res, activeSlaveDevices, "Slave devices retrieved successfully", 200);
    } catch (error) {
        return errorResponse(res, error.message, 400);
    }
};

export const getSlaveDeviceById = async (req, res) => {
    try {
        const { productId, slaveId } = req.params;

        // Find the device by productId (excluding soft-deleted devices)
        const device = await Device.findOne({ productId, deleted: false });
        if (!device) {
            return errorResponse(res, "Device not found", 404);
        }

        // Find the specific slave device by slaveId and ensure it's not deleted
        const slaveDevice = device.slaveDevices.find(slave => slave.slaveId === slaveId && !slave.deleted);
        if (!slaveDevice) {
            return errorResponse(res, "Slave device not found", 404);
        }

        return successResponse(res, slaveDevice, "Slave device retrieved successfully", 200);
    } catch (error) {
        return errorResponse(res, error.message, 400);
    }
};

