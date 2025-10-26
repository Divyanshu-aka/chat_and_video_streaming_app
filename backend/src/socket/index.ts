import cookie from "cookie";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { Server, Socket } from "socket.io";
import type { Request } from "express";
import {
  ChatEventEnum,
  type ChatEvent,
  type IUser,
} from "../utils/constants.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";

const mountJoinChatEvent = (socket: Socket) => {
  socket.on(ChatEventEnum.JOIN_CHAT_EVENT, (chatId: string) => {
    console.log(`User joined 🤝. chatId: `, chatId);
    socket.join(chatId);
  });
};

const mountTypingEvent = (socket: Socket) => {
  socket.on(ChatEventEnum.TYPING_EVENT, (chatId: string) => {
    socket.to(chatId).emit(ChatEventEnum.TYPING_EVENT, chatId);
  });
};

const mountStoppedTypingEvent = (socket: Socket) => {
  socket.on(ChatEventEnum.STOP_TYPING_EVENT, (chatId: string) => {
    socket.to(chatId).emit(ChatEventEnum.STOP_TYPING_EVENT, chatId);
  });
};

const initializeSocketIO = (io: Server) => {
  return io.on("connection", async (socket: Socket) => {
    try {
      const cookies = cookie.parse(socket.handshake.headers?.cookie || "");

      let token = cookies?.accessToken || "";

      if (!token) {
        token = socket.handshake.auth?.accessToken;
      }

      if (!token) {
        throw new ApiError(401, "Unauthorised handshake, token missing");
      }

      const decodedToken = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET as jwt.Secret
      ) as JwtPayload;

      const user = await User.findById(decodedToken?._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
      );

      if (!user) {
        throw new ApiError(401, "Unauthorised handshake, Token invalid");
      }
      socket.user = user; // mount user onto socket object

      socket.join(user._id.toString());
      socket.emit(ChatEventEnum.CONNECTED_EVENT); // emit the connected event so that client is aware
      console.log("User connected 🗼. userId: ", user._id.toString());

      //common events to be mounted on initialization
      mountJoinChatEvent(socket);
      mountTypingEvent(socket);
      mountStoppedTypingEvent(socket);

      socket.on(ChatEventEnum.DISCONNECT_EVENT, () => {
        console.log("user has disconnected 🚫. userId: " + socket.user?._id);
        if (socket.user?._id) {
          socket.leave(socket.user._id.toString());
        }
      });
    } catch (error) {
      socket.emit(
        ChatEventEnum.SOCKET_ERROR_EVENT,
        (error as Error)?.message || "Socket connection error"
      );
    }
  });
};

const emitSocketEvent = (
  req: Request,
  roomId: string,
  event: ChatEvent,
  payload: any
) => {
  req.app.get("io").to(roomId).emit(event, payload);
};

export { initializeSocketIO, emitSocketEvent };
