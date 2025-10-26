import { Document, Types } from 'mongoose';

// ================
// USER CONSTANTS
// ================

export const UserRolesEnum = {
  ADMIN: "ADMIN",
  USER: "USER",
} as const;

export type UserRole = (typeof UserRolesEnum)[keyof typeof UserRolesEnum];
export const AvailableUserRoles = Object.values(UserRolesEnum);

export const UserLoginType = {
  GOOGLE: "GOOGLE",
  GITHUB: "GITHUB",
  EMAIL_PASSWORD: "EMAIL_PASSWORD",
} as const;

export type UserLogin = (typeof UserLoginType)[keyof typeof UserLoginType];
export const AvailableSocialLogins = Object.values(UserLoginType);

// ===================
// DATABASE CONSTANTS
// ===================

export const DB_NAME = "freeapi";

export const USER_TEMP_TOKEN_EXPIRY = 10 * 60 * 1000; // 10 minutes in milliseconds

// ======================
// CHAT EVENT CONSTANTS
// ======================

/**
 * @description set of events that we are using in chat app. more to be added as we develop the chat app
 */
export const ChatEventEnum = {
  // ? once user is ready to go
  CONNECTED_EVENT: "connected",
  // ? when user gets disconnected
  DISCONNECT_EVENT: "disconnect",
  // ? when user joins a socket room
  JOIN_CHAT_EVENT: "joinChat",
  // ? when participant gets removed from group, chat gets deleted or leaves a group
  LEAVE_CHAT_EVENT: "leaveChat",
  // ? when admin updates a group name
  UPDATE_GROUP_NAME_EVENT: "updateGroupName",
  // ? when new message is received
  MESSAGE_RECEIVED_EVENT: "messageReceived",
  // ? when there is new one on one chat, new group chat or user gets added in the group
  NEW_CHAT_EVENT: "newChat",
  // ? when there is an error in socket
  SOCKET_ERROR_EVENT: "socketError",
  // ? when participant stops typing
  STOP_TYPING_EVENT: "stopTyping",
  // ? when participant starts typing
  TYPING_EVENT: "typing",
  // ? when message is deleted
  MESSAGE_DELETE_EVENT: "messageDeleted",
} as const;

export type ChatEvent = (typeof ChatEventEnum)[keyof typeof ChatEventEnum];
export const AvailableChatEvents = Object.values(ChatEventEnum);

// ========================
// TYPESCRIPT INTERFACES
// ========================

export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  password: string;
  avatar?: {
    url: string;
    localPath: string;
  };
  role: UserRole;
  loginType: UserLogin;
  refeshToken?: string;
  forgotPasswordToken?: string;
  forgotPasswordExpiry?: Date;
  emailVerificationToken?: string;
  emailVerificationExpiry?: Date;
  isEmailVerified: boolean;
  lastVerificationEmailSent?: Date;
  createdAt: Date;
  updatedAt: Date;
  checkPassword(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
  generateTempToken(): {
    unhashedToken: string;
    hashedToken: string;
    tokenExpiry: number;
  };
}

export interface IUserPublic {
  _id: string | Types.ObjectId;
  username: string;
  email: string;
  avatar?: {
    url: string;
    localPath: string;
  };
  role?: UserRole;
}

export interface IAttachment {
  url: string;
  localPath: string;
}

export interface IChatMessage extends Document {
  _id: Types.ObjectId;
  sender: Types.ObjectId | IUser;
  content: string;
  attachments: IAttachment[];
  chat: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChat extends Document {
  _id: Types.ObjectId;
  name: string;
  isGroupChat: boolean;
  lastMessage?: Types.ObjectId | IChatMessage;
  participants: Types.ObjectId[] | IUser[];
  admin: Types.ObjectId | IUser;
  createdAt: Date;
  updatedAt: Date;
}
