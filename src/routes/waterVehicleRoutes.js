import express from "express";
import {
  createWaterVehicle,
  getAllWaterVehicles,
  getWaterVehicleById,
  updateWaterVehicle,
  deleteWaterVehicle,
  getWaterVehicleByPhoneNumber
} from "../controllers/waterVehicleController.js";
import upload from "../middleware/uploadMiddleware.js"; // Middleware for handling image uploads

const router = express.Router();

router.post("/", upload.single("vehiclePhoto"), createWaterVehicle);
router.get("/", getAllWaterVehicles);
router.get("/:id", getWaterVehicleById);
router.get("/phoneNumber/:phoneNumber", getWaterVehicleByPhoneNumber);

router.patch("/:id", upload.single("vehiclePhoto"), updateWaterVehicle);
router.delete("/:id", deleteWaterVehicle);

export default router;
