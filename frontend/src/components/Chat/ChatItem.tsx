import {
  EllipsisVerticalIcon,
  PaperClipIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { deleteOneOnOneChat } from "../../api";
import { useAuth } from "../../context/AuthContext";
import type { ChatListItemInterface } from "../../interfaces/chat";
import { classNames, getChatObjectMetadata, requestHandler } from "../../utils";
import GroupChatDetailsModal from "./GroupChatDetailsModal";

const ChatItem: React.FC<{
  chat: ChatListItemInterface;
  onClick: (chat: ChatListItemInterface) => void;
  isActive?: boolean;
  unreadCount?: number;
  onChatDelete: (chatId: string) => void;
}> = ({ chat, onClick, isActive, unreadCount = 0, onChatDelete }) => {
  const { user } = useAuth();
  const [openOptions, setOpenOptions] = useState(false);
  const [openGroupInfo, setOpenGroupInfo] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    // Trigger animation on mount
    const timer = setTimeout(() => setIsAnimating(false), 500);
    return () => clearTimeout(timer);
  }, [chat._id]); // Re-trigger animation when chat ID changes

  // Define an asynchronous function named 'deleteChat'.
  const deleteChat = async () => {
    await requestHandler(
      //  A callback function that performs the deletion of a one-on-one chat by its ID.
      async () => await deleteOneOnOneChat(chat._id),
      null,
      // A callback function to be executed on success. It will call 'onChatDelete'
      // function with the chat's ID as its parameter.
      () => {
        onChatDelete(chat._id);
      },
      // The 'alert' function (likely to display error messages to the user.
      alert
    );
  };

  if (!chat) return;
  return (
    <>
      <GroupChatDetailsModal
        open={openGroupInfo}
        onClose={() => {
          setOpenGroupInfo(false);
        }}
        chatId={chat._id}
        onGroupDelete={onChatDelete}
      />
      <div
        onClick={() => onClick(chat)}
        onMouseLeave={() => setOpenOptions(false)}
        className={classNames(
          "group px-4 py-3 flex justify-between gap-3 items-center cursor-pointer transition-all duration-100",
          isActive
            ? "bg-linear-to-r from-[#00ADB5]/20 to-[#00ADB5]/10 rounded-2xl mx-2 shadow-lg shadow-[#00ADB5]/20 scale-[1.02] "
            : "hover:bg-[#00ADB5]/5 hover:rounded-xl hover:mx-1",
          unreadCount > 0 ? "bg-[#00ADB5]/5" : "",
          isAnimating ? "animate-slideInFromLeft" : ""
        )}
        style={{
          animation: isAnimating ? "slideInFromLeft 0.07s ease-out" : "none",
        }}
      >
        <div className="flex justify-center items-center shrink-0">
          {chat.isGroupChat ? (
            <div
              className={classNames(
                "w-12 h-12 relative flex-shrink-0 rounded-full flex items-center justify-center shadow-md transition-all duration-300",
                isActive
                  ? "bg-gradient-to-br from-[#00ADB5] to-[#008c94] scale-110"
                  : "bg-[#00ADB5]/10"
              )}
            >
              <svg
                className={classNames(
                  "w-6 h-6",
                  isActive ? "text-white" : "text-[#00ADB5]"
                )}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M16.5 13c-1.2 0-3.07.34-4.5 1-1.43-.67-3.3-1-4.5-1C5.33 13 1 14.08 1 16.25V19h22v-2.75c0-2.17-4.33-3.25-6.5-3.25zm-4 4.5h-10v-1.25c0-.54 2.56-1.75 5-1.75s5 1.21 5 1.75v1.25zm9 0H14v-1.25c0-.46-.2-.86-.52-1.22.88-.3 1.96-.53 3.02-.53 2.44 0 5 1.21 5 1.75v1.25zM7.5 12c1.93 0 3.5-1.57 3.5-3.5S9.43 5 7.5 5 4 6.57 4 8.5 5.57 12 7.5 12zm0-5.5c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 5.5c1.93 0 3.5-1.57 3.5-3.5S18.43 5 16.5 5 13 6.57 13 8.5s1.57 3.5 3.5 3.5zm0-5.5c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" />
              </svg>
            </div>
          ) : (
            <div className="relative">
              <img
                src={getChatObjectMetadata(chat, user!).avatar}
                className={classNames(
                  "w-12 h-12 rounded-full object-cover shadow-md transition-all duration-300",
                  isActive
                    ? "border-2 border-[#00ADB5] ring-4 ring-[#00ADB5]/20 scale-110"
                    : "border-2 border-[#00ADB5]/30"
                )}
              />
              <div
                className={classNames(
                  "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white transition-all duration-300",
                  isActive
                    ? "bg-[#00ADB5] ring-2 ring-[#00ADB5]/30"
                    : "bg-[#00ADB5]"
                )}
              ></div>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 border-b border-[#00ADB5]/10 pb-3">
          <div className="flex justify-between items-baseline mb-1">
            <p
              className={classNames(
                "font-medium text-[#222831] text-base truncate",
                unreadCount > 0 ? "font-semibold" : ""
              )}
            >
              {getChatObjectMetadata(chat, user!).title}
            </p>
            <small className="text-[#393E46]/70 text-xs flex-shrink-0 ml-2">
              {moment(chat.updatedAt).add("TIME_ZONE", "hours").fromNow(true)}
            </small>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center text-left min-w-0 flex-1">
              {chat.lastMessage && chat.lastMessage.attachments.length > 0 ? (
                <PaperClipIcon className="text-[#393E46]/70 h-4 w-4 mr-1 flex-shrink-0" />
              ) : null}
              <small
                className={classNames(
                  "text-sm truncate",
                  unreadCount > 0
                    ? "text-[#222831] font-medium"
                    : "text-[#393E46]"
                )}
              >
                {getChatObjectMetadata(chat, user!).lastMessage ||
                  "No messages yet"}
              </small>
            </div>
            {unreadCount > 0 ? (
              <span
                className={classNames(
                  "min-w-[22px] h-5 px-2 text-white text-xs rounded-full flex items-center justify-center ml-2 flex-shrink-0 font-semibold transition-all duration-300",
                  isActive
                    ? "bg-white text-[#00ADB5] shadow-md scale-110"
                    : "bg-[#00ADB5] shadow-sm"
                )}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </div>
        </div>
        <div className="self-start pt-5 items-center relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenOptions(!openOptions);
            }}
            className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <EllipsisVerticalIcon className="h-5 w-5 text-[#8a9ba8]" />
          </button>
          <div
            className={classNames(
              "z-20 text-left absolute right-0 top-full mt-1 text-sm w-52 bg-white rounded-xl p-2 shadow-xl border border-[#00ADB5]/20",
              openOptions ? "block" : "hidden"
            )}
          >
            {chat.isGroupChat ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenGroupInfo(true);
                }}
                className="px-6 py-3 w-full rounded inline-flex items-center hover:bg-[#00ADB5]/10 text-[#222831] text-left text-sm"
              >
                <InformationCircleIcon className="h-5 w-5 mr-3" />
                Group info
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const ok = confirm(
                    "Are you sure you want to delete this chat?"
                  );
                  if (ok) {
                    deleteChat();
                  }
                }}
                className="px-6 py-3 text-[#222831] rounded w-full inline-flex items-center hover:bg-[#00ADB5]/10 text-left text-sm"
              >
                <TrashIcon className="h-5 w-5 mr-3" />
                Delete chat
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatItem;
