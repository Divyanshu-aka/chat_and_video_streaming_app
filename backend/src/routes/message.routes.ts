import { Router } from "express";
import {
  getAllMessages,
  sendMessage,
  deleteMessage,
} from "../controllers/message.controllers.js";
import { verifyJwt } from "../middlewares/auth.middlewares.js";
import { upload } from "../middlewares/multer.middlewares.js";

const router: Router = Router();

router.use(verifyJwt);

router
  .route("/:chatId")
  .get(getAllMessages)
  .post(upload.fields([{ name: "attachments", maxCount: 5 }]), sendMessage);

router.route("/:chatId/:messageId").delete(deleteMessage);

export default router;
