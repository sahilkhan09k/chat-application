import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"; 
import { ApiResponse } from "../utils/ApiResponse.js";
import User from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }
        const accessToken = await user.generateAccessToken();  // Fixed typo
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access tokens");
    }
};

const signUp = asyncHandler(async (req, res) => {
    const { fullName, email, password } = req.body;

    // Validate required fields
    if ([fullName, email, password].some((field) => !field?.trim())) {
        throw new ApiError(400, "All fields are required");
    }

    if (password.length < 6) {
        throw new ApiError(400, "Password must be at least 6 characters long");
    }

    // Check if user already exists
    const existedUser = await User.findOne({ email });
    if (existedUser) {
        throw new ApiError(409, "User with this email already exists");
    }

    // Handle Profile Picture Upload
    let profilePicUrl = "";
    if (req.files?.profilePic?.[0]?.path) {
        const profilePic = await uploadOnCloudinary(req.files.profilePic[0].path);
        if (!profilePic) {
            throw new ApiError(500, "Error uploading profile picture");
        }
        profilePicUrl = profilePic.url;
    }

    // Create new user
    const user = await User.create({
        fullName,
        email,
        password,
        profilePic: profilePicUrl
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering a user!");
    }

    // Return response
    return res.status(201).json(new ApiResponse(201, createdUser, "User registered successfully"));
});

export { signUp };
