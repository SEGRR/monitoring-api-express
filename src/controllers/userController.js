import User from "../models/userModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";
import Device from "../models/device-metadata.js";

// ✅ Register User with Profile Picture & Document
export const registerUser = asyncHandler(async (req, res) => {
    const { name, email, phoneNumber, password, governmentId, societyName, address, state, role } = req.body;

    const userExists = await User.findOne({ phoneNumber , deleted:false });
    if (userExists) {
        return errorResponse(res, "Phone Number already in use", 400);
    }

    // File Uploads
    const profilePicture = req.files?.profilePicture ? req.files.profilePicture[0].path : null;
    const documentId = req.files?.documentId ? req.files.documentId[0].path : null;

    const user = await User.create({
        name, email, phoneNumber, password, governmentId, societyName, address, state, role,
        profilePicture, documentId
    });

    return successResponse(res, {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        documentId: user.documentId,
        token: user.getSignedJwtToken()
    }, "User registered successfully", 201);
});

// ✅ Update Profile with New Profile Picture / Document
export const updateUser = asyncHandler(async (req, res) => {
    const updates = req.body;
    updates.lastUpdated = new Date();

    // Handle File Uploads
    if (req.files?.profilePicture) {
        updates.profilePicture = req.files.profilePicture[0].path;
    }
    if (req.files?.documentId) {
        updates.documentId = req.files.documentId[0].path;
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true, runValidators: true }).select("-password");

    if (!updatedUser) {
        return errorResponse(res, "User not found", 404);
    }

    return successResponse(res, updatedUser, "User updated successfully", 200);
});


// ✅ Login User
export const loginUser = asyncHandler(async (req, res) => {
    const { phoneNumber, password } = req.body;
    const user = await User.findOne({ phoneNumber, deleted: false });
    if (!user || !(await user.matchPassword(password))) {
        return errorResponse(res, "Invalid credentials", 401);
    }
    const { name, email, governmentId, societyName, address, state, role,profilePicture, documentId , deviceList } = user
    return successResponse(res, {
        name, email, governmentId, societyName, address, state, role,profilePicture, documentId, deviceList,
        token: user.getSignedJwtToken()
    }, "Login successful", 200);
});

// ✅ Get User Profile
export const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
        return errorResponse(res, "User not found", 404);
    }

    return successResponse(res, user, "User profile retrieved successfully", 200);
});

// ✅ Soft Delete User (set deleted = true)
export const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(req.user.id, { $set: { deleted: true } }, { new: true });

    if (!user) {
        return errorResponse(res, "User not found", 404);
    }

    return successResponse(res, null, "User deleted", 200);
});


export const assignDevice = asyncHandler(async (req, res) => {
    const { userId, devicesList } = req.body; // Updated property name

    // Validate request body
    if (!userId || !Array.isArray(devicesList) || devicesList.length === 0) {
        return errorResponse(res, "userId and a non-empty array of devicesList are required", 400);
    }

    // ✅ Check if the user exists and is not soft-deleted
    const user = await User.findOne({ _id: userId, deleted: { $ne: true } });
    if (!user) {
        return errorResponse(res, "User not found or deleted", 404);
    }

    // ✅ Fetch all valid devices from DB
    const validDevices = await Device.find({ productId: { $in: devicesList } });

    // Extract existing product IDs from DB to check validity
    const validProductIds = validDevices.map(device => device.productId);

    // ✅ Filter out already assigned devices & invalid devices
    const newDevices = devicesList.filter(id => !user.deviceList.includes(id) && validProductIds.includes(id));

    if (newDevices.length === 0) {
        return errorResponse(res, "No valid new devices to assign", 400);
    }

    // ✅ Add new devices to user's deviceList
    user.deviceList.push(...newDevices);
    await user.save();

    return successResponse(res, user, "Devices assigned successfully", 200);
});
