import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"; 
import { ApiResponse } from "../utils/ApiResponse.js";
import User from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import extractPublicId from "../utils/extractPublicId.js";
import { deleteFromCloudinary } from "../utils/deletFromCloudinary.js";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }
        const accessToken = await user.generateAccesToken();  // Fixed typo
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

    const profilePicPath = req.file?.path;
    const profilePic = await uploadOnCloudinary(profilePicPath)
    if(!profilePic.url) {
        throw new ApiError(500, "Something went wrong while uploading profile picture");
    }


    // Create new user
    const user = await User.create({
        fullName,
        email,
        password,
        profilePic: profilePic.url || "",
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering a user!");
    }

    // Return response
    return res.status(201).json(new ApiResponse(201, createdUser, "User registered successfully"));
});

const login = asyncHandler(async (req, res) => {
    const {email, password} = req.body;
    if(!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({email});

    if(!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordValid = user.isPasswordCorrect(password);
    if(!isPasswordValid) {
        throw new ApiError(400, "Invalid password");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(new ApiResponse(200, loggedInUser, "User logged in successfully"));
})

const logout = asyncHandler(async (req, res) => {
    try {
        // Ensure req.user is populated
        if (!req.user || !req.user._id) {
            throw new ApiError(400, "User information is missing.");
        }

        // Remove refresh token from database
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: { refreshToken: undefined } // Clear all refresh tokens for simplicity
            },
            { new: true }
        );

        // Cookie options
        const options = {
            httpOnly: true,
            secure : true
        };

        // Clear cookies and respond
        return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(
                new ApiResponse(200, {}, "User logged out successfully.")
            );
    } catch (error) {
        throw new ApiError(500, "Failed to log out user.");
    }
})

const updateUserProfilePic = asyncHandler(async (req, res) => {
    const profilePicPath = req.file?.path;

    if(!profilePicPath) {
        throw new ApiError(400, "Profile picture is required");
    }

    const profilePic = await uploadOnCloudinary(profilePicPath);
    if(!profilePic.url) {
        throw new ApiError(500, "Something went wrong while uploading profile picture");
    }

    const user = await User.findById(req.user._id).select("-password -refreshToken");
    if(!user) {
        throw new ApiError(404, "User not found");
    }

    if(user?.profilePic) {
        const cloudId = extractPublicId(user.profilePic);
        await deleteFromCloudinary(cloudId);
    }

    user.profilePic = profilePic.url;
    await user.save({ validateBeforeSave: false });

    // const resUser = user.select("-password -refreshToken");


    return res
    .status(200)
    .json(new ApiResponse(200, user, "Profile picture updated successfully"));
})


const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(
       new ApiResponse(200, req.user, "User fetched succesfully")
    )
})

export {
     signUp,
     login,
     logout,
     updateUserProfilePic,
     getCurrentUser,

};