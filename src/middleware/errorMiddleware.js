const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    return res.status(err.statusCode || 500).json({
        status: "failed",
        data: null,
        msg: err.message || "Internal Server Error"
    });
};

export default errorHandler;
