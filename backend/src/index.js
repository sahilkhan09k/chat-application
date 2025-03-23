import mongoose from "mongoose";
import dotenv from "dotenv"
import connectDB from "./db/index.js";
import { app } from "./app.js";
import {Server} from "socket.io"
import http from "http"
import path from "path";
import express from "express"

dotenv.config({
    path : './env'
})

const server = http.createServer(app);
const io = new Server(server, {
    cors : {
        origin : process.env.CORS_ORIGIN,
    }
});

const __dirname = path.resolve();


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

if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../frontend/dist")));
  
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
    });
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