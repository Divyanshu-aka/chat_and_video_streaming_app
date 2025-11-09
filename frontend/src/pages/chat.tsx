import {
  PaperAirplaneIcon,
  XCircleIcon,
} from "@heroicons/react/20/solid";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  deleteMessage,
  getChatMessages,
  getUserChats,
  sendMessage,
} from "../api";
import AddChatModal from "../components/Chat/AddChatModal";
import ChatItem from "../components/Chat/ChatItem";
import MessageItem from "../components/Chat/MessageItem";
import Typing from "../components/Chat/Typing";
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
  const navigate = useNavigate();

  // Create a reference using 'useRef' to hold the currently selected chat.
  // 'useRef' is used here because it ensures that the 'currentChat' value within socket event callbacks
  // will always refer to the latest value, even if the component re-renders.
  const currentChat = useRef<ChatListItemInterface | null>(null);

  // To keep track of the setTimeout function
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Define state variables and their initial values using 'useState'
  const [isConnected, setIsConnected] = useState(false); // For tracking socket connection

  const [openAddChat, setOpenAddChat] = useState(false); // To control the 'Add Chat' modal
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
      if (showMenu && !target.closest('.menu-container')) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  return (
    <>
      <AddChatModal
        open={openAddChat}
        onClose={() => {
          setOpenAddChat(false);
        }}
        onSuccess={() => {
          getChats();
        }}
      />

      <div className="w-full justify-between items-stretch h-screen flex flex-shrink-0 overflow-hidden">
        {/* Sidebar */}
        <div className="w-[30%] relative bg-white overflow-y-auto">
          {/* Header */}
          <div className="z-10 w-full sticky top-0 bg-[#f0f2f5] px-4 py-2.5 flex justify-between items-center gap-3">
            <div className="flex items-center gap-3 flex-1">
              <img
                src={user?.avatar?.url || "https://via.placeholder.com/40"}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate("/profile")}
                title="View Profile"
              />
            </div>
            <div className="flex items-center gap-5">
              <button
                className="text-[#54656f] hover:text-[#111b21] transition-colors"
                title="Communities"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.072 1.761a10.05 10.05 0 0 0-9.303 5.65.977.977 0 0 0 1.756.855 8.098 8.098 0 0 1 7.496-4.553.977.977 0 1 0 .051-1.952zM1.926 11.64a10.05 10.05 0 0 0 2.137 5.006c.23.305.662.226.865-.12l4.239-7.247c.185-.315.023-.687-.323-.838a7.685 7.685 0 0 1-4.262-4.395c-.115-.373-.526-.479-.832-.269a10.024 10.024 0 0 0-1.824 7.863zm10.119 9.598a10.05 10.05 0 0 0 8.955-5.048c.176-.347-.024-.741-.407-.833l-7.948-1.902c-.34-.081-.68.134-.764.485a7.687 7.687 0 0 1-2.788 4.508c-.296.253-.25.689.082.888a9.996 9.996 0 0 0 2.87.902zm8.716-7.852a10.05 10.05 0 0 0-2.2-5.046c-.236-.301-.66-.22-.862.13l-4.239 7.247c-.185.315-.023.687.323.838a7.685 7.685 0 0 1 4.262 4.395c.115.373.526.479.832.269a10.024 10.024 0 0 0 1.884-7.833zM11.47 2.77a10.054 10.054 0 0 0-8.94 5.046c-.175.347.025.741.407.833l7.948 1.902c.34.081.68-.134.764-.485a7.687 7.687 0 0 1 2.788-4.508c.296-.253.25-.689-.082-.888a9.996 9.996 0 0 0-2.885-.9z"/>
                </svg>
              </button>
              <button
                className="text-[#54656f] hover:text-[#111b21] transition-colors"
                title="Status"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
              </button>
              <button
                onClick={() => setOpenAddChat(true)}
                className="text-[#54656f] hover:text-[#111b21] transition-colors"
                title="New Chat"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.005 3.175H4.674C3.642 3.175 3 3.789 3 4.821V21.02l3.544-3.514h12.461c1.033 0 2.064-1.06 2.064-2.093V4.821c-.001-1.032-1.032-1.646-2.064-1.646zm-4.989 9.869H7.041V11.1h6.975v1.944zm3-4H7.041V7.1h9.975v1.944z"/>
                </svg>
              </button>
              <div className="relative menu-container">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="text-[#54656f] hover:text-[#111b21] transition-colors"
                  title="Menu"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z"/>
                  </svg>
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-200">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        navigate("/profile");
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profile
                    </button>
                    <button
                      onClick={async () => {
                        setShowMenu(false);
                        const confirmed = window.confirm("Are you sure you want to logout?");
                        if (confirmed) {
                          await logout();
                        }
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="px-2 pb-2 pt-2 bg-white border-b border-[#e9edef]">
            <div className="relative">
              <input
                type="text"
                placeholder="Search or start new chat"
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value.toLowerCase())}
                className="w-full bg-[#f0f2f5] text-[#111b21] placeholder-[#667781] rounded-lg px-4 py-2 pl-16 focus:outline-none text-sm"
              />
              <svg className="w-5 h-5 absolute left-6 top-2.5 text-[#54656f]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.009 13.805h-.636l-.22-.219a5.184 5.184 0 0 0 1.256-3.386 5.207 5.207 0 1 0-5.207 5.208 5.183 5.183 0 0 0 3.385-1.255l.221.22v.635l4.004 3.999 1.194-1.195-3.997-4.007zm-4.808 0a3.605 3.605 0 1 1 0-7.21 3.605 3.605 0 0 1 0 7.21z"/>
              </svg>
            </div>
          </div>

          {/* Chat List */}
          <div className="overflow-y-auto">
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
                        unreadMessages.filter((n) => n.chat === chat._id).length
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
        </div>

        {/* Chat Area */}
        <div className="w-[70%] flex flex-col">
          {currentChat.current && currentChat.current?._id ? (
            <>
              {/* Chat Header */}
              <div className="px-4 py-2.5 bg-[#f0f2f5] flex justify-between items-center border-l border-[#d1d7db]">
                <div className="flex justify-start items-center gap-3">
                  {currentChat.current.isGroupChat ? (
                    <div className="w-10 h-10 relative flex-shrink-0">
                      {currentChat.current.participants
                        .slice(0, 3)
                        .map((participant, i) => {
                          return (
                            <img
                              key={participant._id}
                              src={participant.avatar.url}
                              className={classNames(
                                "w-7 h-7 border-2 border-white rounded-full absolute object-cover",
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
                    <img
                      className="h-10 w-10 rounded-full flex-shrink-0 object-cover"
                      src={
                        getChatObjectMetadata(currentChat.current, user!).avatar
                      }
                    />
                  )}
                  <div>
                    <p className="font-medium text-[#111b21] text-[16px]">
                      {getChatObjectMetadata(currentChat.current, user!).title}
                    </p>
                    <small className="text-[#667781] text-[13px] leading-[20px]">
                      {
                        getChatObjectMetadata(currentChat.current, user!)
                          .description
                      }
                    </small>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <button className="text-[#54656f] hover:text-[#111b21] transition-colors">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M15.009 13.805h-.636l-.22-.219a5.184 5.184 0 0 0 1.256-3.386 5.207 5.207 0 1 0-5.207 5.208 5.183 5.183 0 0 0 3.385-1.255l.221.22v.635l4.004 3.999 1.194-1.195-3.997-4.007zm-4.808 0a3.605 3.605 0 1 1 0-7.21 3.605 3.605 0 0 1 0 7.21z"/>
                    </svg>
                  </button>
                  <button className="text-[#54656f] hover:text-[#111b21] transition-colors">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div
                className={classNames(
                  "flex-1 overflow-y-auto px-16 py-3 flex flex-col-reverse gap-1.5",
                  "bg-[#efeae2]"
                )}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='84' height='88' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d9dbd5' fill-opacity='0.4'%3E%3Cpath d='M37.534 14.161c-.085.341-.248.656-.478.925a2.68 2.68 0 01-.667.565 1.982 1.982 0 01-.927.208c-.36-.01-.71-.113-1.022-.303a2.145 2.145 0 01-.696-.722 2.37 2.37 0 01-.281-1.033c-.005-.362.074-.719.232-1.043.157-.324.387-.605.669-.822.282-.217.61-.362.96-.424.35-.062.71-.04 1.052.066.341.105.65.29.904.539.254.25.443.558.554.903.11.345.139.711.084 1.07l-.384.071zm26.318-4.967c.14.42.176.869.104 1.305-.071.436-.248.846-.516 1.195-.268.35-.616.628-1.016.812-.4.184-.844.267-1.29.243a2.505 2.505 0 01-1.265-.398 2.652 2.652 0 01-.862-.894 2.924 2.924 0 01-.348-1.277c-.006-.448.09-.889.283-1.29.192-.4.478-.747.834-1.012.356-.265.772-.44 1.214-.512.443-.072.9-.039 1.333.098.434.136.827.371 1.149.685.322.315.562.701.698 1.129l-.318.116z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              >
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
                          isGroupChatMessage={currentChat.current?.isGroupChat}
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
                <div className="px-4 py-3 bg-[#f0f2f5]">
                  <div className="flex gap-2 overflow-x-auto">
                    {attachedFiles.map((file, i) => {
                      return (
                        <div
                          key={i}
                          className="relative flex-shrink-0 w-20 h-20 rounded overflow-hidden group"
                        >
                          <img
                            className="w-full h-full object-cover"
                            src={URL.createObjectURL(file)}
                            alt="attachment"
                          />
                          <button
                            onClick={() => {
                              setAttachedFiles(
                                attachedFiles.filter((_, ind) => ind !== i)
                              );
                            }}
                            className="absolute -top-1.5 -right-1.5 bg-[#ef4444] hover:bg-[#dc2626] rounded-full p-1"
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
              <div className="px-4 py-2 bg-[#f0f2f5] flex items-center gap-2 border-l border-[#d1d7db]">
                <button className="p-2 rounded-full hover:bg-[#d1d7db]/30 text-[#54656f] transition-colors">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9.153 11.603c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962zm-3.204 1.362c-.026-.307-.131 5.218 6.063 5.551 6.066-.25 6.066-5.551 6.066-5.551-6.078 1.416-12.129 0-12.129 0zm11.363 1.108s-.669 1.959-5.051 1.959c-3.505 0-5.388-1.164-5.607-1.959 0 0 5.912 1.055 10.658 0zM11.804 1.011C5.609 1.011.978 6.033.978 12.228s4.826 10.761 11.021 10.761S23.02 18.423 23.02 12.228c.001-6.195-5.021-11.217-11.216-11.217zM12 21.354c-5.273 0-9.381-3.886-9.381-9.159s3.942-9.548 9.215-9.548 9.548 4.275 9.548 9.548c-.001 5.272-4.109 9.159-9.382 9.159zm3.108-9.751c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962z"/>
                  </svg>
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
                  className="p-2 rounded-full hover:bg-[#d1d7db]/30 text-[#54656f] cursor-pointer transition-colors"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M1.816 15.556v.002c0 1.502.584 2.912 1.646 3.972s2.472 1.647 3.974 1.647a5.58 5.58 0 003.972-1.645l9.547-9.548c.769-.768 1.147-1.767 1.058-2.817-.079-.968-.548-1.927-1.319-2.698-1.594-1.592-4.068-1.711-5.517-.262l-7.916 7.915c-.881.881-.792 2.25.214 3.261.959.958 2.423 1.053 3.263.215l5.511-5.512c.28-.28.267-.722.053-.936l-.244-.244c-.191-.191-.567-.349-.957.04l-5.506 5.506c-.18.18-.635.127-.976-.214-.098-.097-.576-.613-.213-.973l7.915-7.917c.818-.817 2.267-.699 3.23.262.5.501.802 1.1.849 1.685.051.573-.156 1.111-.589 1.543l-9.547 9.549a3.97 3.97 0 01-2.829 1.171 3.975 3.975 0 01-2.83-1.173 3.973 3.973 0 01-1.172-2.828c0-1.071.415-2.076 1.172-2.83l7.209-7.211c.157-.157.264-.579.028-.814L11.5 4.36a.572.572 0 00-.834.018l-7.205 7.207a5.577 5.577 0 00-1.645 3.971z"/>
                  </svg>
                </label>

                <input
                  type="text"
                  placeholder="Type a message"
                  value={message}
                  onChange={handleOnMessageChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      sendChatMessage();
                    }
                  }}
                  className="flex-1 bg-white text-[#111b21] placeholder-[#667781] rounded-lg px-4 py-2.5 focus:outline-none text-[15px]"
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!message && attachedFiles.length <= 0}
                  className="p-2 rounded-full hover:bg-[#d1d7db]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-[#54656f]"
                >
                  {message || attachedFiles.length > 0 ? (
                    <PaperAirplaneIcon className="w-6 h-6" />
                  ) : (
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.999 14.942c2.001 0 3.531-1.53 3.531-3.531V4.35c0-2.001-1.53-3.531-3.531-3.531S8.469 2.35 8.469 4.35v7.061c0 2.001 1.53 3.531 3.53 3.531zm6.238-3.53c0 3.531-2.942 6.002-6.237 6.002s-6.237-2.471-6.237-6.002H3.761c0 4.001 3.178 7.297 7.061 7.885v3.884h2.354v-3.884c3.884-.588 7.061-3.884 7.061-7.885h-2z"/>
                    </svg>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col justify-center items-center text-gray-500 bg-[#f8f9fa] border-l border-[#d1d7db]">
              <div className="text-center max-w-md px-8">
                <div className="mb-8 inline-block">
                  <svg viewBox="0 0 303 172" className="w-80 h-auto opacity-60" fill="none">
                    <path d="M151.5 1.5C68.8 1.5 1 69.3 1 152s67.8 150.5 150.5 150.5S302 234.7 302 152 234.2 1.5 151.5 1.5zm0 270.5c-66.3 0-120-53.7-120-120s53.7-120 120-120 120 53.7 120 120-53.7 120-120 120z" fill="#d1d7db" opacity="0.3"/>
                    <circle cx="151.5" cy="152" r="45" fill="#d1d7db" opacity="0.3"/>
                  </svg>
                </div>
                <h3 className="text-[32px] font-light mb-4 text-[#41525d]">ChatStream Web</h3>
                <p className="text-sm text-[#667781] leading-[20px] mb-8">
                  Send and receive messages without keeping your phone online.<br/>
                  Use ChatStream on up to 4 linked devices and 1 phone at the same time.
                </p>
                <div className="border-t border-[#d1d7db] pt-6">
                  <div className="flex items-center justify-center gap-1 text-xs text-[#667781]">
                    <svg className="w-3 h-3" viewBox="0 0 10 12" fill="currentColor">
                      <path d="M5 0C3.1 0 1.5 1.6 1.5 3.5c0 1.4.8 2.6 2 3.2v2.3c0 .3.2.5.5.5h2c.3 0 .5-.2.5-.5V6.7c1.2-.6 2-1.8 2-3.2C8.5 1.6 6.9 0 5 0zm1 6.2c-.2.1-.3.3-.3.5v2H4.3v-2c0-.2-.1-.4-.3-.5C3.3 6 2.8 5.3 2.8 4.5c0-1.2.9-2.2 2.2-2.2s2.2 1 2.2 2.2c0 .8-.5 1.5-1.2 1.7z"/>
                    </svg>
                    <span>End-to-end encrypted</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ChatPage;
