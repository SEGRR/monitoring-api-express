import { successResponse, errorResponse } from '../utils/response.js';

export const loginUser = async (req, res) => {
    try {
        const user = { id: 1, name: "John Doe", email: "john@example.com" };
        return successResponse(res, user, "Login successful");
    } catch (error) {
        return errorResponse(res, "Invalid credentials", 401);
    }
};
