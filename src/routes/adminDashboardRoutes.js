import express from "express";
import { getAdminKpis, getTodayDeviceFlow , getUnregisteredDevices, getNewUsers , getAdminNotificationSummary} from "../controllers/adminDashboardController.js";

const router = express.Router();

router.get("/kpis", getAdminKpis);

router.get('/device-flow-today', getTodayDeviceFlow);
router.get('/unregistered-devices', getUnregisteredDevices);
router.get('/new-users', getNewUsers);
router.get('/notifications', getAdminNotificationSummary);



export default router;
