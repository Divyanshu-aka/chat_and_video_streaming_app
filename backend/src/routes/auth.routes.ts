import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  changeCurrentPassword,
} from "../controllers/auth.controllers.js";
import { verifyJwt } from "../middlewares/auth.middlewares.js";

const router: Router = Router();

// Public routes (no authentication required)
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/refresh-token").post(refreshAccessToken);

// Protected routes (authentication required)
router.route("/logout").post(verifyJwt, logoutUser);
router.route("/current-user").get(verifyJwt, getCurrentUser);
router.route("/change-password").post(verifyJwt, changeCurrentPassword);

export default router;
