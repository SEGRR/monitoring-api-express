import express from 'express';
import { createDevice, getAllDevices, getDeviceById, updateDevice, deleteDevice , assignDeviceToUser } from '../controllers/deviceController.js';
import {addSlaveDevice,updateSlaveDevice,deleteSlaveDevice,getSlaveDevices ,getSlaveDeviceById} from '../controllers/deviceController.js';
import { protect , masterAdminOnly } from '../middleware/authMiddleware.js';
const router = express.Router();

router.post('/', createDevice);
router.get('/', getAllDevices);
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




export default router;
