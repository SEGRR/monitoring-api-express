import User from '../models/userModel.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse , errorResponse } from '../utils/responseHandler.js';

export const loginMasterAdmin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // ✅ Check if user exists & is not deleted
    const user = await User.findOne({ email, deleted: { $ne: true } });

    if (!user) {
        return errorResponse(res, "Invalid credentials", 401);
    }

    // ✅ Check if user is a master-admin
    if (user.role !== "master-admin") {
        return errorResponse(res, "Access denied. You are not a master-admin", 403);
    }

    // ✅ Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
        return errorResponse(res, "Invalid credentials", 401);
    }

    return successResponse(res, {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: user.getSignedJwtToken()
    }, "Master-Admin login successful", 200);
});
export const changePassword = asyncHandler(async (req, res) => {
    const { phoneNumber, newPassword } = req.body;
  
    if (!phoneNumber || !newPassword) {
      return errorResponse(res ,'Phone number and new password are required', 400);
    }
  
    const user = await User.findOne({ phoneNumber });
    if (!user) {
       return errorResponse(res , "User not Found" , 401)
    }
  
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
  
     return successResponse(res, null , "Password Changed Successfully")
  });