import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getUserForSideBar = asyncHandler(async (req, res) => {
    const user = req.user?._id;
    const users = await User.find({ _id: { $ne: user } }).select("-password -refreshToken");

    if(!users) {
        throw new ApiError(404, "Something went wrong while fetching users");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, users, "Users fetched successfully"));
})

const getMessages = asyncHandler(async (req, res) => {
    const user = req.user?._id;
    const {id : recieverId} = req.params;

    if(!recieverId) {
        throw new ApiError(400, "Reciever id is required");
    }

    const messages = await Message.find({
        $or: [
            { senderId: user, receiverId: recieverId },
            { senderId: recieverId, receiverId: user }
        ]
    })

    return res
    .status(200)
    .json(new ApiResponse(200, messages, "Messages fetched successfully"));
})

const sendMessage = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const {id : recieverId} = req.params;
    const {text, image} = req.body;

    if(!recieverId) {
        throw new ApiError(400, "Reciever id is required");
    }

    if(!text && !image) {
        throw new ApiError(400, "Message text or image is required");
    }

    const imageId = req.file?.path;
    const cloudImage = await uploadOnCloudinary(imageId);
    if(!cloudImage?.url) {
        throw new ApiError(500, "Something went wrong while uploading image");
    }

    const message = Message.create({
        senderId: userId,
        receiverId: recieverId,
        text,
        image: cloudImage?.url || ""
    })

    return res
    .status(201)
    .json(new ApiResponse(201, message, "Message sent successfully"));
})

export {
    getUserForSideBar,
    getMessages,
    sendMessage,
}