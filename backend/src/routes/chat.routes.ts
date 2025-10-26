import { Router } from "express";
import { oneOnOneChat, searchAvailableUsers } from "../controllers/chat.controllers.js";
import { verifyJwt } from "../middlewares/auth.middlewares.js";

const router: Router = Router();

router.use(verifyJwt);

router.route("/users").get(searchAvailableUsers);
router.route("/one-on-one/:recieverId").post(oneOnOneChat);

export default router;