import { Router } from "express";
import {
  oneOnOneChat,
  searchAvailableUsers,
  renameGroupChat,
  addParticipantToGroupChat,
  createGroupChat,
  deleteGroupChat,
  deleteOneOnOneChat,
  getAllChats,
  groupChatDetails,
  leaveGroupChat,
  removeParticipantFromGroupChat,
} from "../controllers/chat.controllers.js";
import { verifyJwt } from "../middlewares/auth.middlewares.js";

const router: Router = Router();

router.use(verifyJwt);

router.route("/").get(getAllChats);

router.route("/users").get(searchAvailableUsers);

router.route("/one-on-one/:recieverId").post(oneOnOneChat);

router.route("/group").post(createGroupChat);

router
  .route("/group/:chatId")
  .get(groupChatDetails)
  .patch(renameGroupChat)
  .delete(deleteGroupChat);

router
  .route("/group/:chatId/:participantId")
  .post(addParticipantToGroupChat)
  .delete(removeParticipantFromGroupChat);

router.route("/leave/group/:chatId").delete(leaveGroupChat);

router.route("/delete/one-on-one/:chatId").delete(deleteOneOnOneChat);

export default router;
