import express from 'express';
import { createDevice, getAllDevices, getDeviceById, updateDevice, deleteDevice , assignDeviceToUser,getUnassignedDevices } from '../controllers/deviceController.js';
import {addSlaveDevice,updateSlaveDevice,deleteSlaveDevice,getSlaveDevices ,getSlaveDeviceById, getUnregisteredDevices } from '../controllers/deviceController.js';
import { getDeviceData } from '../controllers/dataController.js';
import { protect , masterAdminOnly } from '../middleware/authMiddleware.js';
import { getDevicesByProductIds } from '../controllers/deviceController.js';
const router = express.Router();

router.post('/', createDevice);
router.get('/', getAllDevices);
router.get('/unassigned', getUnassignedDevices);
router.get("/unregistered", getUnregisteredDevices);
router.get('/:productId', getDeviceById);
router.patch('/:productId', updateDevice);
router.delete('/:productId', deleteDevice);


// CRUD for Slave Devices
router.post('/:productId/slave', addSlaveDevice); // Add a new slave device
router.get('/:productId/slave/:slaveId' , getSlaveDeviceById)
router.patch('/:productId/slave/:slaveId', updateSlaveDevice); // Update slave device
router.delete('/:productId/slave/:slaveId', deleteSlaveDevice); // Soft delete slave device
router.get('/:productId/slave', getSlaveDevices); // Retrieve all active slave devices
router.post("/:productId/assign", protect, masterAdminOnly, assignDeviceToUser);

router.post("/devices-by-list", getDevicesByProductIds);



// Data routes
router.post('/:productId/slave/:slaveId/data' , getDeviceData);



export default router;
