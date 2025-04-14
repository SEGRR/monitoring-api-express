import express from "express";
import { protect, masterAdminOnly } from "../middleware/authMiddleware.js";
import {changePassword} from '../controllers/authController.js'
import { getAllUsers, deleteUser, createAdmin } from "../controllers/adminController.js";
import { loginMasterAdmin } from "../controllers/authController.js";
const router = express.Router();

router.post('/login' , loginMasterAdmin)
router.post('/change-password', changePassword);
export default router;
