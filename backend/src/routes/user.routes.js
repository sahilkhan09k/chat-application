import express from 'express';
import { Router } from 'express';
import { signUp } from '../controllers/user.controller.js';
import { upload } from '../middleware/multer.middleware.js';

const router = Router();

router.route("/signup").post(upload.single("profilePic"), signUp);

export default router;

