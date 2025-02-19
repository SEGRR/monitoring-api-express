import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import { errorResponse } from "../utils/responseHandler.js";


export const protect = asyncHandler(async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select("-password");

            if (!req.user || req.user.deleted) {
                return errorResponse(res, "User not found or deleted", 401);
            }

            next();
        } catch (error) {
            return errorResponse(res, "Not authorized, token failed", 401);
        }
    } else {
        return errorResponse(res, "Not authorized, no token", 401);
    }
});

// ✅ Master-Admin Only Middleware
export const masterAdminOnly = (req, res, next) => {
    if (req.user && req.user.role === "master-admin") {
        next();
    } else {
        return errorResponse(res, "Access denied. Master-Admin only", 403);
    }
};