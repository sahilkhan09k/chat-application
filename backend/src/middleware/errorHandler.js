import { ApiError } from "../utils/ApiError.js";
const errorHandler = (err, req, res, next) => {
    console.error("Backend Error:", err); // Log the full error in the backend console

    // If it's an instance of ApiError, return the proper response
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors || [],
        });
    }

    // If it's not an ApiError, return a generic server error
    return res.status(500).json({
        success: false,
        message: "Internal Server Error",
    });
};

export default errorHandler;
