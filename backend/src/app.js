import express, { urlencoded } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import errorHandler from './middleware/errorHandler.js';
import path from 'path';
const app = express();

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true,
}))


app.use(express.json({
    limit : '10mb'
}));

app.use(urlencoded({
    extended : true,
    limit : '10mb'
}))

app.use(express.static('public'));

app.use(cookieParser());

const __dirname = path.resolve();


//router import statements
import userRouter from './routes/user.routes.js';
import messageRouter from './routes/message.routes.js';

app.use("/api/v1/user", userRouter);
app.use("/api/v1/message", messageRouter);

app.use(errorHandler);

if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../frontend/dist")));
  
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
    });
  }


export {app};