import express from 'express';
import { Router } from 'express';
import { signUp, login, logout, updateUserProfilePic, getCurrentUser } from '../controllers/user.controller.js';
import { upload } from '../middleware/multer.middleware.js';
import { verifyJwt } from '../middleware/auth.middleware.js';

const router = Router();

router.route("/signup").post( upload.single("profilePic"), signUp);
router.route("/login").post(login);
router.route("/logout").post(verifyJwt, logout);
router.route("/profile-pic").patch(verifyJwt, upload.single("profilePic"), updateUserProfilePic);
router.route("/get-current-user").get(verifyJwt, getCurrentUser);

export default router;

