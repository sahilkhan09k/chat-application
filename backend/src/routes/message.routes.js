import { Router } from "express";
import { verifyJwt } from "../middleware/auth.middleware.js";
import { getUserForSideBar, getMessages, sendMessage } from "../controllers/message.controller.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();

router.route("/get-users").get(verifyJwt, getUserForSideBar);
router.route("/get-messages/:id").get(verifyJwt, getMessages);
router.route("/send-message/:id").post(verifyJwt, upload.single("image"), sendMessage);


export default router;