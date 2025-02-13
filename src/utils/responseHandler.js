export const successResponse = (res, data = null, msg = "Request successful", statusCode = 200) => {
    return res.status(statusCode).json({
        status: "success",
        data,
        msg
    });
};

export const errorResponse = (res, msg = "Request failed", statusCode = 400) => {
    return res.status(statusCode).json({
        status: "failed",
        data: null,
        msg
    });
};
