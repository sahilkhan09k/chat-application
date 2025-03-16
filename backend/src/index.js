import mongoose from "mongoose";
import dotenv from "dotenv"
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path : './env'
})

connectDB()
.then(() => {
    app.listen(process.env.PORT || 3000, () => {
        console.log(`Server is running on PORT : ${process.env.PORT}`);
    })
})
.catch((error) => {
    console.log("MONGODB connection error : ", error);
    process.exit(1);
})