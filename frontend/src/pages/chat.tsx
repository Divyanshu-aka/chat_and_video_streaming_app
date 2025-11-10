import { XCircleIcon } from "@heroicons/react/20/solid";
import { useEffect, useRef, useState } from "react";
import {
  deleteMessage,
  getChatMessages,
  getUserChats,
  sendMessage,
} from "../api";
import ChatItem from "../components/Chat/ChatItem";
import MessageItem from "../components/Chat/MessageItem";
import NewChatInline from "../components/Chat/NewChatInline";
import Typing from "../components/Chat/Typing";
import ProfileModal from "../components/ProfileModal";
import LeftSidebar from "../components/layout/LeftSidebar";
import RightSidebar from "../components/layout/RightSidebar";
import ProfileSidebar from "../components/layout/ProfileSidebar";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import type {
  ChatListItemInterface,
  ChatMessageInterface,
} from "../interfaces/chat";
import {
  LocalStorage,
  classNames,
  getChatObjectMetadata,
  requestHandler,
} from "../utils";
import {
  Search,
  Video,
  MoreVertical,
  Smile,
  Paperclip,
  Mic,
  Send,
  Users,
  Folder,
  Calendar,
} from "lucide-react";

const CONNECTED_EVENT = "connected";
const DISCONNECT_EVENT = "disconnect";
const JOIN_CHAT_EVENT = "joinChat";
const NEW_CHAT_EVENT = "newChat";
const TYPING_EVENT = "typing";
const STOP_TYPING_EVENT = "stopTyping";
const MESSAGE_RECEIVED_EVENT = "messageReceived";
const LEAVE_CHAT_EVENT = "leaveChat";
const UPDATE_GROUP_NAME_EVENT = "updateGroupName";
const MESSAGE_DELETE_EVENT = "messageDeleted";
// const SOCKET_ERROR_EVENT = "socketError";

const ChatPage = () => {
  // Import the 'useAuth' and 'useSocket' hooks from their respective contexts
  const { user, logout } = useAuth();
  const { socket } = useSocket();

  // Create a reference using 'useRef' to hold the currently selected chat.
  // 'useRef' is used here because it ensures that the 'currentChat' value within socket event callbacks
  // will always refer to the latest value, even if the component re-renders.
  const currentChat = useRef<ChatListItemInterface | null>(null);

  // To keep track of the setTimeout function
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Define state variables and their initial values using 'useState'
  const [isConnected, setIsConnected] = useState(false); // For tracking socket connection

  const [openAddChat, setOpenAddChat] = useState(false); // To control the 'Add Chat' modal
  const [openProfile, setOpenProfile] = useState(false); // To control the 'Profile' modal
  const [loadingChats, setLoadingChats] = useState(false); // To indicate loading of chats
  const [loadingMessages, setLoadingMessages] = useState(false); // To indicate loading of messages

  const [chats, setChats] = useState<ChatListItemInterface[]>([]); // To store user's chats
  const [messages, setMessages] = useState<ChatMessageInterface[]>([]); // To store chat messages
  const [unreadMessages, setUnreadMessages] = useState<ChatMessageInterface[]>(
    []
  ); // To track unread messages

  const [isTyping, setIsTyping] = useState(false); // To track if someone is currently typing
  const [selfTyping, setSelfTyping] = useState(false); // To track if the current user is typing

  const [message, setMessage] = useState(""); // To store the currently typed message
  const [localSearchQuery, setLocalSearchQuery] = useState(""); // For local search functionality

  const [attachedFiles, setAttachedFiles] = useState<File[]>([]); // To store files attached to messages
  const [showMenu, setShowMenu] = useState(false); // To control menu dropdown

  // New state for sidebar management
  const [activeTab, setActiveTab] = useState<
    "chats" | "video" | "contacts" | "folders" | "calendar" | "settings"
  >("chats");
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [isProfileSidebarOpen, setIsProfileSidebarOpen] = useState(false);

  /**
   *  A  function to update the last message of a specified chat to update the chat list
   */
  const updateChatLastMessage = (
    chatToUpdateId: string,
    message: ChatMessageInterface // The new message to be set as the last message
  ) => {
    // Search for the chat with the given ID in the chats array
    const chatToUpdate = chats.find((chat) => chat._id === chatToUpdateId)!;

    // Update the 'lastMessage' field of the found chat with the new message
    chatToUpdate.lastMessage = message;

    // Update the 'updatedAt' field of the chat with the 'updatedAt' field from the message
    chatToUpdate.updatedAt = message?.updatedAt;

    // Update the state of chats, placing the updated chat at the beginning of the array
    setChats([
      chatToUpdate, // Place the updated chat first
      ...chats.filter((chat) => chat._id !== chatToUpdateId), // Include all other chats except the updated one
    ]);
  };
  /**
   *A function to update the chats last message specifically in case of deletion of message *
   **/

  const updateChatLastMessageOnDeletion = (
    chatToUpdateId: string, //ChatId to find the chat
    message: ChatMessageInterface //The deleted message
  ) => {
    // Search for the chat with the given ID in the chats array
    const chatToUpdate = chats.find((chat) => chat._id === chatToUpdateId)!;

    //Updating the last message of chat only in case of deleted message and chats last message is same
    if (chatToUpdate.lastMessage?._id === message._id) {
      requestHandler(
        async () => getChatMessages(chatToUpdateId),
        null,
        (req) => {
          const { data } = req;

          chatToUpdate.lastMessage = data[0];
          setChats([...chats]);
        },
        alert
      );
    }
  };
  const getChats = async () => {
    requestHandler(
      async () => await getUserChats(),
      setLoadingChats,
      (res) => {
        const { data } = res;
        setChats(data || []);
      },
      alert
    );
  };

  const getMessages = async () => {
    // Check if a chat is selected, if not, show an alert
    if (!currentChat.current?._id) return alert("No chat is selected");

    // Check if socket is available, if not, show an alert
    if (!socket) return alert("Socket not available");

    // Emit an event to join the current chat
    socket.emit(JOIN_CHAT_EVENT, currentChat.current?._id);

    // Filter out unread messages from the current chat as those will be read
    setUnreadMessages(
      unreadMessages.filter((msg) => msg.chat !== currentChat.current?._id)
    );

    // Make an async request to fetch chat messages for the current chat
    requestHandler(
      // Fetching messages for the current chat
      async () => await getChatMessages(currentChat.current?._id || ""),
      // Set the state to loading while fetching the messages
      setLoadingMessages,
      // After fetching, set the chat messages to the state if available
      (res) => {
        const { data } = res;
        setMessages(data || []);
      },
      // Display any error alerts if they occur during the fetch
      alert
    );
  };

  // Function to send a chat message
  const sendChatMessage = async () => {
    // If no current chat ID exists or there's no socket connection, exit the function
    if (!currentChat.current?._id || !socket) return;

    // Emit a STOP_TYPING_EVENT to inform other users/participants that typing has stopped
    socket.emit(STOP_TYPING_EVENT, currentChat.current?._id);

    // Use the requestHandler to send the message and handle potential response or error
    await requestHandler(
      // Try to send the chat message with the given message and attached files
      async () =>
        await sendMessage(
          currentChat.current?._id || "", // Chat ID or empty string if not available
          message, // Actual text message
          attachedFiles // Any attached files
        ),
      null,
      // On successful message sending, clear the message input and attached files, then update the UI
      (res) => {
        setMessage(""); // Clear the message input
        setAttachedFiles([]); // Clear the list of attached files
        setMessages((prev) => [res.data, ...prev]); // Update messages in the UI
        updateChatLastMessage(currentChat.current?._id || "", res.data); // Update the last message in the chat
      },

      // If there's an error during the message sending process, raise an alert
      alert
    );
  };
  const deleteChatMessage = async (message: ChatMessageInterface) => {
    //ONClick delete the message and reload the chat when deleteMessage socket gives any response in chat.tsx
    //use request handler to prevent any errors

    await requestHandler(
      async () => await deleteMessage(message.chat, message._id),
      null,
      (res) => {
        setMessages((prev) => prev.filter((msg) => msg._id !== res.data._id));
        updateChatLastMessageOnDeletion(message.chat, message);
      },
      alert
    );
  };

  const handleOnMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Update the message state with the current input value
    setMessage(e.target.value);

    // If socket doesn't exist or isn't connected, exit the function
    if (!socket || !isConnected) return;

    // Check if the user isn't already set as typing
    if (!selfTyping) {
      // Set the user as typing
      setSelfTyping(true);

      // Emit a typing event to the server for the current chat
      socket.emit(TYPING_EVENT, currentChat.current?._id);
    }

    // Clear the previous timeout (if exists) to avoid multiple setTimeouts from running
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Define a length of time (in milliseconds) for the typing timeout
    const timerLength = 3000;

    // Set a timeout to stop the typing indication after the timerLength has passed
    typingTimeoutRef.current = setTimeout(() => {
      // Emit a stop typing event to the server for the current chat
      socket.emit(STOP_TYPING_EVENT, currentChat.current?._id);

      // Reset the user's typing state
      setSelfTyping(false);
    }, timerLength);
  };

  const onConnect = () => {
    setIsConnected(true);
  };

  const onDisconnect = () => {
    setIsConnected(false);
  };

  /**
   * Handles the "typing" event on the socket.
   */
  const handleOnSocketTyping = (chatId: string) => {
    // Check if the typing event is for the currently active chat.
    if (chatId !== currentChat.current?._id) return;

    // Set the typing state to true for the current chat.
    setIsTyping(true);
  };

  /**
   * Handles the "stop typing" event on the socket.
   */
  const handleOnSocketStopTyping = (chatId: string) => {
    // Check if the stop typing event is for the currently active chat.
    if (chatId !== currentChat.current?._id) return;

    // Set the typing state to false for the current chat.
    setIsTyping(false);
  };

  const onMessageDelete = (message: ChatMessageInterface) => {
    if (message?.chat !== currentChat.current?._id) {
      setUnreadMessages((prev) =>
        prev.filter((msg) => msg._id !== message._id)
      );
    } else {
      setMessages((prev) => prev.filter((msg) => msg._id !== message._id));
    }

    updateChatLastMessageOnDeletion(message.chat, message);
  };

  /**
   * Handles the event when a new message is received.
   */
  const onMessageReceived = (message: ChatMessageInterface) => {
    // Check if the received message belongs to the currently active chat
    if (message?.chat !== currentChat.current?._id) {
      // If not, update the list of unread messages
      setUnreadMessages((prev) => [message, ...prev]);
    } else {
      // If it belongs to the current chat, update the messages list for the active chat
      setMessages((prev) => [message, ...prev]);
    }

    // Update the last message for the chat to which the received message belongs
    updateChatLastMessage(message.chat || "", message);
  };

  const onNewChat = (chat: ChatListItemInterface) => {
    setChats((prev) => [chat, ...prev]);
  };

  // This function handles the event when a user leaves a chat.
  const onChatLeave = (chat: ChatListItemInterface) => {
    // Check if the chat the user is leaving is the current active chat.
    if (chat._id === currentChat.current?._id) {
      // If the user is in the group chat they're leaving, close the chat window.
      currentChat.current = null;
      // Remove the currentChat from local storage.
      LocalStorage.remove("currentChat");
    }
    // Update the chats by removing the chat that the user left.
    setChats((prev) => prev.filter((c) => c._id !== chat._id));
  };

  // Function to handle changes in group name
  const onGroupNameChange = (chat: ChatListItemInterface) => {
    // Check if the chat being changed is the currently active chat
    if (chat._id === currentChat.current?._id) {
      // Update the current chat with the new details
      currentChat.current = chat;

      // Save the updated chat details to local storage
      LocalStorage.set("currentChat", chat);
    }

    // Update the list of chats with the new chat details
    setChats((prev) => [
      // Map through the previous chats
      ...prev.map((c) => {
        // If the current chat in the map matches the chat being changed, return the updated chat
        if (c._id === chat._id) {
          return chat;
        }
        // Otherwise, return the chat as-is without any changes
        return c;
      }),
    ]);
  };

  useEffect(() => {
    // Fetch the chat list from the server.
    getChats();

    // Retrieve the current chat details from local storage.
    const _currentChat = LocalStorage.get("currentChat");

    // If there's a current chat saved in local storage:
    if (_currentChat) {
      // Set the current chat reference to the one from local storage.
      currentChat.current = _currentChat;
      // If the socket connection exists, emit an event to join the specific chat using its ID.
      socket?.emit(JOIN_CHAT_EVENT, _currentChat.current?._id);
      // Fetch the messages for the current chat.
      getMessages();
    }
    // An empty dependency array ensures this useEffect runs only once, similar to componentDidMount.
  }, []);

  // This useEffect handles the setting up and tearing down of socket event listeners.
  useEffect(() => {
    // If the socket isn't initialized, we don't set up listeners.
    if (!socket) return;

    // Set up event listeners for various socket events:
    // Listener for when the socket connects.
    socket.on(CONNECTED_EVENT, onConnect);
    // Listener for when the socket disconnects.
    socket.on(DISCONNECT_EVENT, onDisconnect);
    // Listener for when a user is typing.
    socket.on(TYPING_EVENT, handleOnSocketTyping);
    // Listener for when a user stops typing.
    socket.on(STOP_TYPING_EVENT, handleOnSocketStopTyping);
    // Listener for when a new message is received.
    socket.on(MESSAGE_RECEIVED_EVENT, onMessageReceived);
    // Listener for the initiation of a new chat.
    socket.on(NEW_CHAT_EVENT, onNewChat);
    // Listener for when a user leaves a chat.
    socket.on(LEAVE_CHAT_EVENT, onChatLeave);
    // Listener for when a group's name is updated.
    socket.on(UPDATE_GROUP_NAME_EVENT, onGroupNameChange);
    //Listener for when a message is deleted
    socket.on(MESSAGE_DELETE_EVENT, onMessageDelete);
    // When the component using this hook unmounts or if `socket` or `chats` change:
    return () => {
      // Remove all the event listeners we set up to avoid memory leaks and unintended behaviors.
      socket.off(CONNECTED_EVENT, onConnect);
      socket.off(DISCONNECT_EVENT, onDisconnect);
      socket.off(TYPING_EVENT, handleOnSocketTyping);
      socket.off(STOP_TYPING_EVENT, handleOnSocketStopTyping);
      socket.off(MESSAGE_RECEIVED_EVENT, onMessageReceived);
      socket.off(NEW_CHAT_EVENT, onNewChat);
      socket.off(LEAVE_CHAT_EVENT, onChatLeave);
      socket.off(UPDATE_GROUP_NAME_EVENT, onGroupNameChange);
      socket.off(MESSAGE_DELETE_EVENT, onMessageDelete);
    };

    // Note:
    // The `chats` array is used in the `onMessageReceived` function.
    // We need the latest state value of `chats`. If we don't pass `chats` in the dependency array,
    // the `onMessageReceived` will consider the initial value of the `chats` array, which is empty.
    // This will not cause infinite renders because the functions in the socket are getting mounted and not executed.
    // So, even if some socket callbacks are updating the `chats` state, it's not
    // updating on each `useEffect` call but on each socket call.
  }, [socket, chats]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showMenu && !target.closest(".menu-container")) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  return (
    <>
      <div className="h-screen w-screen flex align-center justify-between bg-gradient-to-br from-[#393E46] via-[#2d3139] to-[#222831] overflow-hidden">
        <div className="h-full flex flex-col py-2">
          <div className="flex items-center justify-end px-2 mb-2">
            <button
              onClick={() => setIsProfileSidebarOpen(true)}
              className="relative group"
            >
              <img
                src={user?.avatar?.url || "https://via.placeholder.com/40"}
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover border-4 border-[#00ADB5] shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              />
              <div className="absolute bottom-0 right-2 w-3.5 h-3.5 bg-[#00ADB5] rounded-full border-2 border-white"></div>
            </button>
          </div>

          <LeftSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        <div className="flex-1 flex flex-col mr-4 mb-4">
          <div className="flex items-center justify-between p-2 gap-3">
            <h1 className="text-2xl font-bold text-[#EEEEEE]">
              Hi, {user?.username?.split(" ")[0] || "Jamaica"}!
            </h1>

            <div className="flex-1 flex justify-center">
              <p className="font-bold text-[#00ADB5]">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            <div className=""></div>
          </div>

          {/* Middle Section - Chat List & Messages (Floating Window) */}
          <div className="flex-1 flex overflow-hidden rounded-3xl shadow-2xl bg-[#EEEEEE] backdrop-blur-xl border border-[#00ADB5]/20 relative">
            <ProfileModal
              open={openProfile}
              onClose={() => {
                setOpenProfile(false);
              }}
            />

            {/* Chat List */}
            <div className="w-80 bg-white border-r border-[#00ADB5]/20 flex flex-col">
              {activeTab === "chats" ? (
                openAddChat ? (
                  /* New Chat Creation Interface */
                  <NewChatInline
                    onClose={() => setOpenAddChat(false)}
                    onSuccess={() => {
                      getChats();
                      setOpenAddChat(false);
                    }}
                  />
                ) : (
                  <>
                    {/* Header with Profile */}
                    <div className="p-4 border-b border-[#00ADB5]/20">
                      <div className="flex items-center gap-3 mb-4">
                        <img
                          src={
                            user?.avatar?.url ||
                            "https://via.placeholder.com/40"
                          }
                          alt="Profile"
                          className="w-10 h-10 rounded-full object-cover border-2 border-[#00ADB5]"
                        />
                        <div className="flex-1">
                          <h1 className="text-lg font-bold text-[#222831]">
                            Hi, {user?.username?.split(" ")[0] || "Jamaica"}!
                          </h1>
                        </div>

                        <button
                          onClick={() => setOpenAddChat(true)}
                          className="p-2 hover:bg-[#00ADB5]/10 rounded-full transition-colors group"
                          title="New Chat"
                        >
                          <svg
                            className="w-5 h-5 text-[#393E46] group-hover:text-[#00ADB5]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                        </button>

                        <div className="relative">
                          <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2 hover:bg-[#00ADB5]/10 rounded-full transition-colors"
                          >
                            <MoreVertical className="w-5 h-5 text-[#393E46]" />
                          </button>
                          {showMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl py-2 z-50 border border-[#00ADB5]/20">
                              <button
                                onClick={() => {
                                  setShowMenu(false);
                                  setOpenProfile(true);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-[#00ADB5]/10 text-[#222831] flex items-center gap-2"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  strokeWidth="2"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                  />
                                </svg>
                                Profile
                              </button>
                              <button
                                onClick={async () => {
                                  setShowMenu(false);
                                  const confirmed = window.confirm(
                                    "Are you sure you want to logout?"
                                  );
                                  if (confirmed) {
                                    await logout();
                                  }
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-[#00ADB5]/10 text-red-600 flex items-center gap-2"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  strokeWidth="2"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                  />
                                </svg>
                                Logout
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Search */}
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#393E46]" />
                        <input
                          type="text"
                          placeholder="Search"
                          value={localSearchQuery}
                          onChange={(e) =>
                            setLocalSearchQuery(e.target.value.toLowerCase())
                          }
                          className="w-full bg-[#EEEEEE] text-[#222831] placeholder-[#393E46]/60 rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#00ADB5] text-sm"
                        />
                      </div>
                    </div>

                    {/* Chat List */}
                    <div className="flex-1 overflow-y-auto">
                      {loadingChats ? (
                        <div className="flex justify-center items-center h-96">
                          <Typing />
                        </div>
                      ) : (
                        [...chats]
                          .filter((chat) =>
                            localSearchQuery
                              ? getChatObjectMetadata(chat, user!)
                                  .title?.toLocaleLowerCase()
                                  ?.includes(localSearchQuery)
                              : true
                          )
                          .map((chat) => {
                            return (
                              <ChatItem
                                chat={chat}
                                isActive={chat._id === currentChat.current?._id}
                                unreadCount={
                                  unreadMessages.filter(
                                    (n) => n.chat === chat._id
                                  ).length
                                }
                                onClick={(chat) => {
                                  if (
                                    currentChat.current?._id &&
                                    currentChat.current?._id === chat._id
                                  )
                                    return;
                                  LocalStorage.set("currentChat", chat);
                                  currentChat.current = chat;
                                  setMessage("");
                                  getMessages();
                                }}
                                key={chat._id}
                                onChatDelete={(chatId) => {
                                  setChats((prev) =>
                                    prev.filter((chat) => chat._id !== chatId)
                                  );
                                  if (currentChat.current?._id === chatId) {
                                    currentChat.current = null;
                                    LocalStorage.remove("currentChat");
                                  }
                                }}
                              />
                            );
                          })
                      )}
                    </div>

                    {/* Add Chat Button - removed, will use floating button */}
                  </>
                )
              ) : (
                /* Placeholder content for other tabs */
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <div className="mb-4">
                    {activeTab === "video" && (
                      <Video className="w-16 h-16 text-[#00ADB5] mx-auto mb-4" />
                    )}
                    {activeTab === "contacts" && (
                      <Users className="w-16 h-16 text-[#00ADB5] mx-auto mb-4" />
                    )}
                    {activeTab === "folders" && (
                      <Folder className="w-16 h-16 text-[#00ADB5] mx-auto mb-4" />
                    )}
                    {activeTab === "calendar" && (
                      <Calendar className="w-16 h-16 text-[#00ADB5] mx-auto mb-4" />
                    )}
                    {activeTab === "settings" && (
                      <svg
                        className="w-16 h-16 text-[#00ADB5] mx-auto mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-[#222831] mb-2 capitalize">
                    {activeTab}
                  </h3>
                  <p className="text-[#393E46] text-sm">
                    This feature is coming soon!
                  </p>
                </div>
              )}
            </div>

            {/* Chat Window */}
            <div className="flex-1 flex flex-col bg-[#EEEEEE]">
              {activeTab === "chats" ? (
                currentChat.current && currentChat.current?._id ? (
                  <>
                    {/* Chat User Info */}
                    <div className="px-6 py-4 bg-white flex justify-between items-center border-b border-[#00ADB5]/20">
                      <div className="flex items-center gap-3">
                        {currentChat.current.isGroupChat ? (
                          <div className="w-12 h-12 relative shrink-0">
                            {currentChat.current.participants
                              .slice(0, 3)
                              .map((participant, i) => {
                                return (
                                  <img
                                    key={participant._id}
                                    src={participant.avatar.url}
                                    className={classNames(
                                      "w-8 h-8 border-2 border-white rounded-full absolute object-cover",
                                      i === 0
                                        ? "left-0 top-0 z-30"
                                        : i === 1
                                        ? "left-2.5 top-0 z-20"
                                        : i === 2
                                        ? "left-5 top-0 z-10"
                                        : ""
                                    )}
                                  />
                                );
                              })}
                          </div>
                        ) : (
                          <div className="relative">
                            <img
                              className="h-12 w-12 rounded-full shrink-0 object-cover border-2 border-[#00ADB5] shadow-sm"
                              src={
                                getChatObjectMetadata(
                                  currentChat.current,
                                  user!
                                ).avatar
                              }
                            />
                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#00ADB5] rounded-full border-2 border-white"></div>
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-[#222831] text-lg">
                            {
                              getChatObjectMetadata(currentChat.current, user!)
                                .title
                            }
                          </p>
                          <small className="text-[#393E46] text-sm">
                            {
                              getChatObjectMetadata(currentChat.current, user!)
                                .description
                            }
                          </small>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button className="p-2.5 rounded-full hover:bg-[#00ADB5]/10 text-[#393E46] transition-colors">
                          <Search className="w-5 h-5" />
                        </button>
                        <button className="p-2.5 rounded-full hover:bg-[#00ADB5]/10 text-[#393E46] transition-colors">
                          <Video className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() =>
                            setIsRightSidebarOpen(!isRightSidebarOpen)
                          }
                          className="p-2.5 rounded-full hover:bg-[#00ADB5]/10 text-[#393E46] transition-colors"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-8 py-4 flex flex-col-reverse gap-2 bg-[#EEEEEE]">
                      {loadingMessages ? (
                        <div className="flex justify-center items-center h-full">
                          <Typing />
                        </div>
                      ) : (
                        <>
                          {isTyping ? <Typing /> : null}
                          {messages?.map((msg) => {
                            return (
                              <MessageItem
                                key={msg._id}
                                isOwnMessage={msg.sender?._id === user?._id}
                                isGroupChatMessage={
                                  currentChat.current?.isGroupChat
                                }
                                message={msg}
                                deleteChatMessage={deleteChatMessage}
                              />
                            );
                          })}
                        </>
                      )}
                    </div>

                    {/* Attachments Preview */}
                    {attachedFiles.length > 0 ? (
                      <div className="px-6 py-3 bg-white border-t border-[#00ADB5]/20">
                        <div className="flex gap-2 overflow-x-auto">
                          {attachedFiles.map((file, i) => {
                            return (
                              <div
                                key={i}
                                className="relative shrink-0 w-20 h-20 rounded-xl overflow-hidden group"
                              >
                                <img
                                  className="w-full h-full object-cover"
                                  src={URL.createObjectURL(file)}
                                  alt="attachment"
                                />
                                <button
                                  onClick={() => {
                                    setAttachedFiles(
                                      attachedFiles.filter(
                                        (_, ind) => ind !== i
                                      )
                                    );
                                  }}
                                  className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 rounded-full p-1"
                                >
                                  <XCircleIcon className="h-4 w-4 text-white" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    {/* Input Area */}
                    <div className="px-6 py-4 flex justify-between bg-white border-t border-[#00ADB5]/20">
                      <div className="flex flex-1 items-center gap-3 bg-[#EEEEEE] rounded-2xl px-2 mx-4">
                        <button className="p-2 rounded-full hover:bg-[#00ADB5]/10 text-[#393E46] transition-colors">
                          <Smile className="w-5 h-5" />
                        </button>

                        <input
                          hidden
                          id="attachments"
                          type="file"
                          value=""
                          multiple
                          max={5}
                          onChange={(e) => {
                            if (e.target.files) {
                              setAttachedFiles([...e.target.files]);
                            }
                          }}
                        />
                        <label
                          htmlFor="attachments"
                          className="p-2 rounded-full hover:bg-[#00ADB5]/10 text-[#393E46] cursor-pointer transition-colors"
                        >
                          <Paperclip className="w-5 h-5" />
                        </label>

                        <input
                          type="text"
                          placeholder="Type a message..."
                          value={message}
                          onChange={handleOnMessageChange}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              sendChatMessage();
                            }
                          }}
                          className="flex-1 bg-transparent text-[#222831] placeholder-[#393E46]/60 focus:outline-none text-sm"
                        />
                      </div>
                      <button
                        onClick={sendChatMessage}
                        disabled={!message && attachedFiles.length <= 0}
                        className="p-2.5 rounded-full bg-[#00ADB5] hover:bg-[#008c94] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md disabled:shadow-none text-white"
                      >
                        {message || attachedFiles.length > 0 ? (
                          <Send className="w-5 h-5" />
                        ) : (
                          <Mic className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col justify-center items-center text-[#393E46] bg-[#EEEEEE]">
                    <div className="text-center max-w-md px-8">
                      <div className="mb-8 inline-block">
                        <svg
                          viewBox="0 0 240 240"
                          className="w-48 h-auto opacity-30"
                          fill="none"
                        >
                          <circle
                            cx="120"
                            cy="120"
                            r="80"
                            fill="#00ADB5"
                            opacity="0.2"
                          />
                          <circle
                            cx="120"
                            cy="120"
                            r="50"
                            fill="#00ADB5"
                            opacity="0.4"
                          />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-light mb-3 text-[#222831]">
                        Select a chat to start messaging
                      </h3>
                      <p className="text-sm text-[#393E46] mb-6">
                        Choose a conversation from the list to view messages
                      </p>
                      <button
                        onClick={() => setOpenAddChat(true)}
                        className="px-6 py-2.5 bg-[#00ADB5] hover:bg-[#008c94] text-white rounded-lg transition-colors"
                      >
                        Start New Chat
                      </button>
                    </div>
                  </div>
                )
              ) : (
                /* Placeholder when no tab is selected or non-chat tabs */
                <div className="w-full h-full flex flex-col justify-center items-center text-[#393E46] bg-[#EEEEEE]">
                  <div className="text-center max-w-md px-8">
                    <div className="mb-8 inline-block">
                      {activeTab === "video" && (
                        <Video className="w-24 h-24 text-[#00ADB5] mx-auto" />
                      )}
                      {activeTab === "contacts" && (
                        <Users className="w-24 h-24 text-[#00ADB5] mx-auto" />
                      )}
                      {activeTab === "folders" && (
                        <Folder className="w-24 h-24 text-[#00ADB5] mx-auto" />
                      )}
                      {activeTab === "calendar" && (
                        <Calendar className="w-24 h-24 text-[#00ADB5] mx-auto" />
                      )}
                      {activeTab === "settings" && (
                        <svg
                          className="w-24 h-24 text-[#00ADB5] mx-auto"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      )}
                    </div>
                    <h3 className="text-2xl font-light mb-3 text-[#222831] capitalize">
                      {activeTab}
                    </h3>
                    <p className="text-sm text-[#393E46] mb-6">
                      This feature is coming soon!
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <RightSidebar
              isOpen={isRightSidebarOpen}
              onClose={() => setIsRightSidebarOpen(false)}
            />

            {/* Profile Sidebar */}
            <ProfileSidebar
              isOpen={isProfileSidebarOpen}
              onClose={() => setIsProfileSidebarOpen(false)}
              user={user}
              onEditProfile={() => setOpenProfile(true)}
              onLogout={logout}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatPage;
