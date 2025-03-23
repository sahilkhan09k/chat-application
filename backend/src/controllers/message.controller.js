import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { getRecieverSocketId } from "../index.js";
import { isObjectIdOrHexString } from "mongoose";
import { io } from "../index.js";
import cloudinary from "cloudinary";

const getUserForSideBar = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    let users = await User.find({ _id: { $ne: userId } }).select("-password -refreshToken");

    if (!users) {
        throw new ApiError(404, "Something went wrong while fetching users");
    }

    const usersWithLastMessage = await Promise.all(
        users.map(async (user) => {
            const lastMessage = await Message.findOne({
                $or: [
                    { senderId: userId, receiverId: user._id },
                    { senderId: user._id, receiverId: userId }
                ]
            })
            .sort({ createdAt: -1 }) 
            .select("createdAt"); 

            return {
                ...user.toObject(),
                lastMessageAt: lastMessage?.createdAt || 0 
            };
        })
    );

    const sortedUsers = [...usersWithLastMessage].sort(
        (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
    );

    return res.status(200).json(
        new ApiResponse(200, { allUsers: users, sortedUsers }, "Users fetched successfully")
    );
});


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

    let cloudImageUrl = ""; 


    if (image) {
        try {
            const cloudImage = await cloudinary.v2.uploader.upload(image, {
                resource_type: "auto",
            });
            cloudImageUrl = cloudImage?.secure_url || "";  
        } catch (err) {
            throw new ApiError(500, "Error uploading image to Cloudinary");
        }
    }

    const message = await Message.create({
        senderId: userId,
        receiverId: recieverId,
        text,
        image: cloudImageUrl || ""  
    });

    const recieverSocketId = getRecieverSocketId(recieverId);

    if(recieverSocketId) {
        io.to(recieverSocketId).emit("newMessage", message);  
    }

    return res
        .status(201)
        .json(new ApiResponse(201, message, "Message sent successfully"));
});
export {
    getUserForSideBar,
    getMessages,
    sendMessage,
}