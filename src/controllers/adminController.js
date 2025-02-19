import User from "../models/userModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";

// ✅ 1️⃣ Get All Users (Only Active Users)
export const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find({
        deleted: { $ne: true },   // Exclude soft-deleted users
        _id: { $ne: req.user._id } // Exclude current master-admin
    }).select("-password"); // Remove password from response

    return successResponse(res, users, "Users retrieved successfully", 200);
});
// ✅ 2️⃣ Soft Delete User (Mark User as Deleted)
export const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
        return errorResponse(res, "User not found", 404);
    }

    if (user.deleted) {
        return errorResponse(res, "User is already deleted", 400);
    }

    user.deleted = true; // Mark user as deleted
    await user.save();

    return successResponse(res, null, "User soft deleted successfully", 200);
});

export const createAdmin = asyncHandler(async (req, res) => {
    const { name, email, phoneNumber, password } = req.body;

    // Check if user with the same email or phone already exists
    const existingUser = await User.findOne({ 
        $or: [{ email }, { phoneNumber }],
        deleted: { $ne: true }
    });

    if (existingUser) {
        return errorResponse(res, "Email or phone number already in use", 400);
    }

    const admin = await User.create({
        name,
        email,
        phoneNumber,
        password,
        role: "admin", // Assign admin role
        deleted: false
    });

    return successResponse(res, {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
    }, "Admin created successfully", 201);
});
