import mongoose from "mongoose";
import dotenv from "dotenv"
import connectDB from "./db/index.js";
import { app } from "./app.js";
import {Server} from "socket.io"
import http from "http"

dotenv.config({
    path : './env'
})

const server = http.createServer(app);
const io = new Server(server, {
    cors : {
        origin : process.env.CORS_ORIGIN,
    }
});

export {io}

const userSocketMap = {};

io.on("connection", (socket) => {
    console.log("A user connected", socket.id);

    const userId = socket.handshake.query.userId;
    if(userId) {
        userSocketMap[userId] = socket.id;
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap)); //used to send the events to all the connected clients

    socket.on("disconnect", () => {
        console.log("A user disconnected", socket.id);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    })
});

export function getRecieverSocketId(userId) {
    return userSocketMap[userId];
}

connectDB()
.then(() => {
    server.listen(process.env.PORT || 3000, () => {
        console.log(`Server is running on PORT : ${process.env.PORT}`);
    })
})
.catch((error) => {
    console.log("MONGODB connection error : ", error);
    process.exit(1);
})