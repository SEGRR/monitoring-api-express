import express from "express";
import { getDeviceData, getFlowPeriodsDayWise , getDates } from "../controllers/dataController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();


router.post('/frames', getDeviceData)
router.post('/flow-periods',getFlowPeriodsDayWise )
router.post('/dates', getDates )


export default router;