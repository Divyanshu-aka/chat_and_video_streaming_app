// Import necessary modules and utilities
import axios from "axios";
import { LocalStorage } from "../utils";

// Create an Axios instance for API requests
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URI,
  withCredentials: true,
  timeout: 120000,
});

// Add an interceptor to set authorization header with user token before requests
apiClient.interceptors.request.use(
  function (config) {
    // Retrieve user token from local storage
    const token = LocalStorage.get("token");
    // Set authorization header with bearer token
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
apiClient.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    // Check if error is due to unauthorized access (401)
    if (error.response && error.response.status === 401) {
      // Clear local storage
      LocalStorage.clear();
      // Redirect to login page if not already there
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// API functions for different actions
const loginUser = (data: { username: string; password: string }) => {
  return apiClient.post("/auth/login", data);
};

const registerUser = (data: {
  email: string;
  password: string;
  username: string;
}) => {
  return apiClient.post("/auth/register", data);
};

const logoutUser = () => {
  return apiClient.post("/auth/logout");
};

const getAvailableUsers = () => {
  return apiClient.get("/chats/users");
};

const getUserChats = () => {
  return apiClient.get(`/chats`);
};

const createUserChat = (receiverId: string) => {
  return apiClient.post(`/chats/one-on-one/${receiverId}`);
};

const createGroupChat = (data: { name: string; participants: string[] }) => {
  return apiClient.post(`/chats/group`, data);
};

const getGroupInfo = (chatId: string) => {
  return apiClient.get(`/chats/group/${chatId}`);
};

const updateGroupName = (chatId: string, name: string) => {
  return apiClient.patch(`/chats/group/${chatId}`, { name });
};

const deleteGroup = (chatId: string) => {
  return apiClient.delete(`/chats/group/${chatId}`);
};

const deleteOneOnOneChat = (chatId: string) => {
  return apiClient.delete(`/chats/delete/one-on-one/${chatId}`);
};

const addParticipantToGroup = (chatId: string, participantId: string) => {
  return apiClient.post(`/chats/group/${chatId}/${participantId}`);
};

const removeParticipantFromGroup = (chatId: string, participantId: string) => {
  return apiClient.delete(`/chats/group/${chatId}/${participantId}`);
};

const getChatMessages = (chatId: string) => {
  return apiClient.get(`/messages/${chatId}`);
};

const sendMessage = (chatId: string, content: string, attachments: File[]) => {
  const formData = new FormData();
  if (content) {
    formData.append("content", content);
  }
  attachments?.map((file) => {
    formData.append("attachments", file);
  });
  return apiClient.post(`/messages/${chatId}`, formData);
};

const deleteMessage = (chatId: string, messageId: string) => {
  return apiClient.delete(`/messages/${chatId}/${messageId}`);
};

const updateUserAvatar = (avatar: File) => {
  const formData = new FormData();
  formData.append("avatar", avatar);
  return apiClient.patch("/auth/update-avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// Export all the API functions
export {
  addParticipantToGroup,
  createGroupChat,
  createUserChat,
  deleteGroup,
  deleteOneOnOneChat,
  getAvailableUsers,
  getChatMessages,
  getGroupInfo,
  getUserChats,
  loginUser,
  logoutUser,
  registerUser,
  removeParticipantFromGroup,
  sendMessage,
  updateGroupName,
  deleteMessage,
  updateUserAvatar,
};
