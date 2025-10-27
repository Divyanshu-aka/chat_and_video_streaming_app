import mongoose from "mongoose";
import { ChatEventEnum, type IAttachment } from "../utils/constants.js";
import { User } from "../models/user.model.js";
import { Chat } from "../models/chat.models.js";
import { Message } from "../models/message.models.js";
import { removeLocalFile } from "../utils/helpers.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { emitSocketEvent } from "../socket/index.js";

const chatAggregation = (): mongoose.PipelineStage[] => {
  return [
    {
      //lookup for participants present
      $lookup: {
        from: "users",
        foreignField: "_id",
        localField: "participants",
        as: "participants",
        pipeline: [
          {
            $project: {
              password: 0,
              forgotPasswordToken: 0,
              forgotPasswordExpiry: 0,
              refreshToken: 0,
              emailVerificationToken: 0,
              emailVerificationExpiry: 0,
              lastVerificationEmailSent: 0,
            },
          },
        ],
      },
    },
    {
      // lookup for group chats
      $lookup: {
        from: "chatMessages",
        localField: "lastMessage",
        foreignField: "_id",
        as: "lastMessage",
        pipeline: [
          {
            //get sender details for last message
            $lookup: {
              from: "users",
              localField: "sender",
              foreignField: "_id",
              as: "sender",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    avatar: 1,
                    email: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              sender: { $first: "$sender" },
            },
          },
        ],
      },
    },
    {
      $addFields: {
        lastMessage: { $first: "$lastMessage" },
      },
    },
  ];
};

const removeDeletedChatMessages = async (chatId: string) => {
  const messages = await Message.find({
    chat: new mongoose.Types.ObjectId(chatId),
  });

  let attachments: IAttachment[] = [];

  //get all attachments present in messages
  attachments = attachments.concat(
    ...messages.map((message) => {
      return message.attachments;
    })
  );

  attachments.forEach((attachment) => {
    // remove attachment from local storage
    removeLocalFile(attachment.localPath);
  });

  //delete all messages
  await Message.deleteMany({
    chat: new mongoose.Types.ObjectId(chatId),
  });
};

const searchAvailableUsers = asyncHandler(async (req, res) => {
  // TEMPORARY TESTING - DELETE THIS LINE LATER!
  // req.user = {
  //   _id: new mongoose.Types.ObjectId("672d1234567890abcdef1234"),
  // } as any;

  const users = await User.aggregate([
    {
      $match: {
        _id: {
          $ne: req.user._id, //avoid logged in user
        },
      },
    },
    {
      $project: {
        username: 1,
        avatar: 1,
        email: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, users, "Users fetched successfully"));
});

const oneOnOneChat = asyncHandler(async (req, res) => {
  const { recieverId } = req.params;

  const reciever = await User.findById(recieverId);

  if (!reciever) {
    throw new ApiError(404, "Reciever user not found");
  }

  if (reciever._id === req.user._id) {
    throw new ApiError(400, "Cannot chat with yourself");
  }

  const chat = await Chat.aggregate([
    {
      $match: {
        isGroupChat: false,
        $and: [
          {
            participants: { $elemMatch: { $eq: req.user._id } }, //logged in user
          },
          {
            participants: { $elemMatch: { $eq: reciever._id } }, //reciever
          },
        ],
      },
    },
    ...chatAggregation(),
  ]);

  if (chat.length > 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, chat[0], "Chat fetched successfully"));
  }

  const newChatInstance = await Chat.create({
    name: "one-on-one chat",
    participants: [req.user._id, new mongoose.Types.ObjectId(recieverId)],
    admin: req.user._id,
  });

  const newChat = await Chat.aggregate([
    {
      $match: {
        _id: newChatInstance._id,
      },
    },
    ...chatAggregation(),
  ]);

  const payload = newChat[0];

  if (!payload) {
    throw new ApiError(500, "Internal server error");
  }

  //logic to emit socket event....(newbie with types🫠)
  payload?.participants?.forEach((participant: any) => {
    if (participant._id.toString() === req.user._id.toString()) return;

    emitSocketEvent(
      req,
      participant._id.toString(),
      ChatEventEnum.NEW_CHAT_EVENT,
      payload
    );
  });

  return res
    .status(201)
    .json(new ApiResponse(201, payload, "Chat retrieved successfully"));
});

const createGroupChat = asyncHandler(async (req, res) => {
  const { name, participants } = req.body;

  if (participants.includes(req.user._id.toString())) {
    throw new ApiError(400, "User cannot add himself to group chat");
  }

  const members = [...new Set([...participants, req.user._id.toString()])]; //remove duplicate IDs and add current user

  if (members.length < 3) {
    throw new ApiError(
      400,
      "At least 3 participants are required to create a group chat"
    );
  }

  const newGroupChat = await Chat.create({
    name,
    isGroupChat: true,
    participants: members,
    admin: req.user._id,
  });

  const chat = await Chat.aggregate([
    {
      $match: {
        _id: newGroupChat._id,
      },
    },
    ...chatAggregation(),
  ]);

  const payload = chat[0];

  if (!payload) {
    throw new ApiError(500, "Internal server error");
  }

  // Emit socket event to all participants except the creator
  payload?.participants?.forEach((participant: any) => {
    if (participant._id.toString() === req.user._id.toString()) return;

    emitSocketEvent(
      req,
      participant._id.toString(),
      ChatEventEnum.NEW_CHAT_EVENT,
      payload
    );
  });

  return res
    .status(201)
    .json(new ApiResponse(201, payload, "Group chat created successfully"));
});

const groupChatDetails = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  const groupChat = await Chat.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(chatId),
        isGroupChat: true,
      },
    },
    ...chatAggregation(),
  ]);

  const chat = groupChat[0];

  if (!chat) {
    throw new ApiError(404, "Group chat not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, chat, "Group chat details fetched successfully")
    );
});

const renameGroupChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { name } = req.body;

  const groupChat = await Chat.findOne({
    _id: new mongoose.Types.ObjectId(chatId),
    isGroupChat: true,
  });

  if (!groupChat) {
    throw new ApiError(404, "Group chat not found");
  }

  if (groupChat.admin?.toString() !== req.user._id?.toString()) {
    throw new ApiError(403, "Only group admin can rename the group chat");
  }

  const updatedGroupChat = await Chat.findByIdAndUpdate(
    chatId,
    {
      $set: { name: name },
    },
    { new: true }
  );

  const chat = await Chat.aggregate([
    {
      $match: {
        _id: updatedGroupChat?._id,
      },
    },
    ...chatAggregation(),
  ]);

  const payload = chat[0];

  if (!payload) {
    throw new ApiError(500, "Internal server error");
  }

  payload?.participants?.forEach((participant: any) => {
    emitSocketEvent(
      req,
      participant._id?.toString(),
      ChatEventEnum.UPDATE_GROUP_NAME_EVENT,
      payload
    );
  });

  return res
    .status(200)
    .json(new ApiResponse(200, payload, "Group chat updated successfully"));
});

const addParticipantToGroupChat = asyncHandler(async (req, res) => {
  const { chatId, participantId } = req.params;

  if (!participantId) {
    throw new ApiError(400, "Participant ID is required");
  }

  const groupChat = await Chat.findOne({
    _id: new mongoose.Types.ObjectId(chatId),
    isGroupChat: true,
  });

  if (!groupChat) {
    throw new ApiError(404, "Group chat not found");
  }

  if (groupChat.admin?.toString() !== req.user._id?.toString()) {
    throw new ApiError(
      403,
      "Only group admin can add participants to the group chat"
    );
  }

  const existingParticipant = groupChat.participants;

  if (existingParticipant?.includes(participantId as any)) {
    throw new ApiError(400, "User is already a participant of the group chat");
  }

  const updatedGroupChat = await Chat.findByIdAndUpdate(
    chatId,
    {
      $push: { participants: new mongoose.Types.ObjectId(participantId) },
    },
    { new: true }
  );

  const chat = await Chat.aggregate([
    {
      $match: {
        _id: updatedGroupChat?._id,
      },
    },
    ...chatAggregation(),
  ]);

  const payload = chat[0];

  if (!payload) {
    throw new ApiError(500, "Internal server error");
  }

  emitSocketEvent(req, participantId, ChatEventEnum.NEW_CHAT_EVENT, payload);

  return res
    .status(200)
    .json(new ApiResponse(200, payload, "Participant added successfully"));
});

const removeParticipantFromGroupChat = asyncHandler(async (req, res) => {
  const { chatId, participantId } = req.params;

  if (!participantId) {
    throw new ApiError(400, "Participant ID is required");
  }

  const groupChat = await Chat.findOne({
    _id: new mongoose.Types.ObjectId(chatId),
    isGroupChat: true,
  });

  if (!groupChat) {
    throw new ApiError(404, "Group chat not found");
  }

  if (groupChat.admin?.toString() !== req.user._id?.toString()) {
    throw new ApiError(
      403,
      "Only group admin can remove participants from the group chat"
    );
  }

  const existingParticipant = groupChat.participants;

  if (!existingParticipant?.includes(participantId as any)) {
    throw new ApiError(400, "User is not a participant of the group chat");
  }

  const updatedGroupChat = await Chat.findByIdAndUpdate(
    chatId,
    {
      $pull: { participants: new mongoose.Types.ObjectId(participantId) },
    },
    { new: true }
  );

  const chat = await Chat.aggregate([
    {
      $match: {
        _id: updatedGroupChat?._id,
      },
    },
    ...chatAggregation(),
  ]);

  const payload = chat[0];

  if (!payload) {
    throw new ApiError(500, "Internal server error");
  }

  emitSocketEvent(req, participantId, ChatEventEnum.LEAVE_CHAT_EVENT, payload);

  return res
    .status(200)
    .json(new ApiResponse(200, payload, "Participant removed successfully"));
});

const getAllChats = asyncHandler(async (req, res) => {
  const chats = await Chat.aggregate([
    {
      $match: {
        participants: { $elemMatch: { $eq: req.user._id } },
      },
    },
    ...chatAggregation(),
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, chats, "All chats fetched successfully"));
});

const leaveGroupChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  const groupChat = await Chat.findOne({
    _id: new mongoose.Types.ObjectId(chatId),
    isGroupChat: true,
  });

  if (!groupChat) {
    throw new ApiError(404, "Group chat not found");
  }

  const userId: any = req.user?._id;

  if (!groupChat.participants?.includes(userId)) {
    throw new ApiError(400, "User is not a participant of the group chat");
  }

  const updatedGroupChat = await Chat.findByIdAndUpdate(
    chatId,
    {
      $pull: { participants: req.user._id },
    },
    { new: true }
  );

  const chat = await Chat.aggregate([
    {
      $match: {
        _id: updatedGroupChat?._id,
      },
    },
    ...chatAggregation(),
  ]);

  const payload = chat[0];

  if (!payload) {
    throw new ApiError(500, "Internal server error");
  }

  emitSocketEvent(
    req,
    req.user._id.toString(),
    ChatEventEnum.LEAVE_CHAT_EVENT,
    payload
  );

  return res
    .status(200)
    .json(new ApiResponse(200, payload, "Left group chat successfully"));
});

const deleteGroupChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params as { chatId: string };

  const groupChat = await Chat.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(chatId),
        isGroupChat: true,
      },
    },
  ]);

  const chat = groupChat[0];

  if (!chat) {
    throw new ApiError(404, "Group chat not found");
  }

  if (chat.admin._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only group admin can delete the group chat");
  }

  await Chat.findByIdAndDelete(chatId);

  await removeDeletedChatMessages(chatId);

  chat?.participants?.forEach((participant: any) => {
    if (participant._id.toString() === req.user._id.toString()) return;
    emitSocketEvent(
      req,
      participant._id.toString(),
      ChatEventEnum.LEAVE_CHAT_EVENT,
      chat
    );
  });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Group chat deleted successfully"));
});

const deleteOneOnOneChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params as { chatId: string };

  const chat = await Chat.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(chatId),
      },
    },
  ]);

  const payload = chat[0];

  if (!payload) {
    throw new ApiError(404, "Chat not found");
  }

  await Chat.findByIdAndDelete(chatId);

  await removeDeletedChatMessages(chatId);

  const reciever = payload.participants.find(
    (participant: any) => participant?._id.toString() !== req.user._id.toString()
  );

  emitSocketEvent(
    req,
    reciever._id.toString(),
    ChatEventEnum.LEAVE_CHAT_EVENT,
    payload
  );

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Chat deleted successfully"));
});

export {
  oneOnOneChat,
  searchAvailableUsers,
  createGroupChat,
  groupChatDetails,
  getAllChats,
  renameGroupChat,
  addParticipantToGroupChat,
  removeParticipantFromGroupChat,
  leaveGroupChat,
  deleteGroupChat,
  deleteOneOnOneChat,
};
