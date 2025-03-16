import express from "express";
import { registerUser, loginUser, getUserProfile, updateUser, deleteUser , assignDevices , getUserProfileById, updateUserById, deleteUserById , removeDeviceFromUser } from "../controllers/userController.js";
import upload from "../middleware/uploadMiddleware.js";
import { protect, masterAdminOnly } from "../middleware/authMiddleware.js";
import { getAllUsers } from "../controllers/adminController.js";
const router = express.Router();

// Public routes
router.post("/register", upload.fields([{ name: "profilePicture", maxCount: 1 }, { name: "documentId", maxCount: 1 }]), registerUser);
router.post("/login", loginUser);

// Protected routes (only logged-in users can access)
router.get("/profile", protect, getUserProfile);
router.patch("/profile", protect, upload.fields([{ name: "profilePicture", maxCount: 1 }, { name: "documentId", maxCount: 1 }]), updateUser);
router.delete("/profile", protect, deleteUser);


router.get("/", protect, masterAdminOnly, getAllUsers); // Only master-admin can view all users
router.post("/assign", protect, masterAdminOnly, assignDevices);
router.put('/remove-device', removeDeviceFromUser);

// Only Master-Admin can access these routes
router.get('/:userId' , protect , masterAdminOnly , getUserProfileById);
router.patch('/:userId' , protect , masterAdminOnly , updateUserById);
router.delete('/:userId' , protect  ,masterAdminOnly , deleteUserById);


export default router;
