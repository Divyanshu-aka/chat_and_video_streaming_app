import mongoose from "mongoose";
import { Chat } from "../models/chat.models.js";
import { Message } from "../models/message.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { emitSocketEvent } from "../socket/index.js";
import { ChatEventEnum } from "../utils/constants.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getLocalFilePath,
  getStaticFilePath,
  removeLocalFile,
} from "../utils/helpers.js";
import { request } from "express";

const messageAggregation = (): mongoose.PipelineStage[] => {
  return [
    {
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
  ];
};

const getAllMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  const selectedChat = await Chat.findById(chatId);

  if (!selectedChat) {
    throw new ApiError(404, "Chat not found");
  }

  if (!selectedChat.participants.includes(req.user._id as any)) {
    throw new ApiError(403, "You are not a participant of this chat");
  }

  const messages = await Message.aggregate([
    {
      $match: {
        chat: new mongoose.Types.ObjectId(chatId),
      },
    },
    ...messageAggregation(),
    {
      $sort: { createdAt: -1 },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, messages || [], "Messages fetched successfully")
    );
});

const sendMessage = asyncHandler(async (req, res) => {
  const { chatId } = req.params as { chatId: string };
  const { content } = req.body;

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  if (!content && !files?.attachments?.length) {
    throw new ApiError(400, "Message content or files are required");
  }
  const selectedChat = await Chat.findById(chatId);

  if (!selectedChat) {
    throw new ApiError(404, "Chat not found");
  }

  const attachedFiles: { url: string; filename: string }[] = [];

  if (files?.attachments && files.attachments.length > 0) {
    files.attachments.map((attachment) => {
      attachedFiles.push({
        url: getStaticFilePath(req, attachment.filename),
        filename: getLocalFilePath(attachment.filename),
      });
    });
  }

  const message = await Message.create({
    sender: new mongoose.Types.ObjectId(req.user._id),
    content: content || "",
    chat: new mongoose.Types.ObjectId(chatId),
    attachments: attachedFiles,
  });

  const chat = await Chat.findByIdAndUpdate(
    chatId,
    {
      $set: { latestMessage: message._id },
    },
    { new: true }
  );

  //structure message for response
  const messages = await Message.aggregate([
    {
      $match: {
        _id: message._id,
      },
    },
    ...messageAggregation(),
  ]);

  const recievedMessage = messages[0];

  if (!recievedMessage) {
    throw new ApiError(500, "Internal server error");
  }

  chat?.participants.forEach((participantId) => {
    if (participantId.toString() === req.user._id.toString()) return; // Skip the sender
    emitSocketEvent(
      req,
      participantId.toString(),
      ChatEventEnum.MESSAGE_RECEIVED_EVENT,
      recievedMessage
    );
  });

  return res
    .status(201)
    .json(new ApiResponse(201, recievedMessage, "Message sent successfully"));
});

const deleteMessage = asyncHandler(async (req, res) => {
  const { chatId, messageId } = req.params as {
    chatId: string;
    messageId: string;
  };

  const chat = await Chat.findOne({
    _id: new mongoose.Types.ObjectId(chatId),
    participants: req.user._id as any,
  });

  if (!chat) {
    throw new ApiError(404, "Chat not found or access denied");
  }

  const message = await Message.findOne({
    _id: new mongoose.Types.ObjectId(messageId),
  });

  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  if (message.sender.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      "You are not authorized to delete this message, you are not the sender"
    );
  }

  // Delete attached files from local storage
  if (message.attachments.length > 0) {
    message.attachments.map((attachment) => {
      removeLocalFile(attachment.localPath);
    });
  }

  await Message.deleteOne({ _id: new mongoose.Types.ObjectId(messageId) });

  if (chat.lastMessage?.toString() === message._id.toString()) {
    const lastMessage = await Message.findOne(
      { chat: chat._id },
      {},
      { sort: { createdAt: -1 } }
    );

    await Chat.findByIdAndUpdate(chatId, {
      $set: { lastMessage: lastMessage ? lastMessage._id : null },
    });
  }

  chat.participants.forEach((participantId) => {
    if (participantId.toString() === req.user._id.toString()) return; // Skip the sender
    emitSocketEvent(
      req,
      participantId.toString(),
      ChatEventEnum.MESSAGE_DELETE_EVENT,
      message
    );
  });

  return res
    .status(200)
    .json(new ApiResponse(200, message, "Message deleted successfully"));
});

export { getAllMessages, sendMessage, deleteMessage };
