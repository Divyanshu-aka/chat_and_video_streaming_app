import {
  EllipsisVerticalIcon,
  PaperClipIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import moment from "moment";
import React, { useState } from "react";
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
        role="button"
        onClick={() => onClick(chat)}
        onMouseLeave={() => setOpenOptions(false)}
        className={classNames(
          "group px-4 py-3 flex justify-between gap-3 items-center cursor-pointer hover:bg-[#f5f6f6] transition-colors",
          isActive ? "bg-[#f0f2f5]" : "",
          unreadCount > 0 ? "" : ""
        )}
      >
        <div className="flex justify-center items-center flex-shrink-0">
          {chat.isGroupChat ? (
            <div className="w-[49px] h-[49px] relative flex-shrink-0 bg-[#dfe5e7] rounded-full flex items-center justify-center">
              <svg className="w-7 h-7 text-[#8696a0]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16.5 13c-1.2 0-3.07.34-4.5 1-1.43-.67-3.3-1-4.5-1C5.33 13 1 14.08 1 16.25V19h22v-2.75c0-2.17-4.33-3.25-6.5-3.25zm-4 4.5h-10v-1.25c0-.54 2.56-1.75 5-1.75s5 1.21 5 1.75v1.25zm9 0H14v-1.25c0-.46-.2-.86-.52-1.22.88-.3 1.96-.53 3.02-.53 2.44 0 5 1.21 5 1.75v1.25zM7.5 12c1.93 0 3.5-1.57 3.5-3.5S9.43 5 7.5 5 4 6.57 4 8.5 5.57 12 7.5 12zm0-5.5c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 5.5c1.93 0 3.5-1.57 3.5-3.5S18.43 5 16.5 5 13 6.57 13 8.5s1.57 3.5 3.5 3.5zm0-5.5c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/>
              </svg>
            </div>
          ) : (
            <img
              src={getChatObjectMetadata(chat, user!).avatar}
              className="w-[49px] h-[49px] rounded-full object-cover"
            />
          )}
        </div>
        <div className="flex-1 min-w-0 border-b border-[#e9edef] pb-3">
          <div className="flex justify-between items-baseline mb-0.5">
            <p className="font-normal text-[#111b21] text-[17px] truncate">
              {getChatObjectMetadata(chat, user!).title}
            </p>
            <small className="text-[#667781] text-xs flex-shrink-0 ml-2">
              {moment(chat.updatedAt).add("TIME_ZONE", "hours").fromNow(true)}
            </small>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center text-left min-w-0 flex-1">
              {chat.lastMessage && chat.lastMessage.attachments.length > 0 ? (
                <PaperClipIcon className="text-[#667781] h-4 w-4 mr-1 flex-shrink-0" />
              ) : null}
              <small className="text-[#667781] text-[14px] truncate leading-[20px]">
                {getChatObjectMetadata(chat, user!).lastMessage || "No messages yet"}
              </small>
            </div>
            {unreadCount > 0 ? (
              <span className="bg-[#25d366] min-w-[20px] h-5 px-1.5 text-white text-xs rounded-full flex items-center justify-center ml-2 flex-shrink-0 font-medium">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpenOptions(!openOptions);
          }}
          className="self-start p-1 relative opacity-0 group-hover:opacity-100 transition-opacity -mt-3"
        >
          <EllipsisVerticalIcon className="h-5 w-5 text-[#54656f]" />
          <div
            className={classNames(
              "z-20 text-left absolute right-0 top-full mt-1 text-sm w-52 bg-white rounded-md p-2 shadow-xl",
              openOptions ? "block" : "hidden"
            )}
          >
            {chat.isGroupChat ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenGroupInfo(true);
                }}
                className="px-6 py-3 w-full rounded inline-flex items-center hover:bg-[#f5f6f6] text-[#3b4a54] text-left text-[14.5px]"
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
                className="px-6 py-3 text-[#3b4a54] rounded w-full inline-flex items-center hover:bg-[#f5f6f6] text-left text-[14.5px]"
              >
                <TrashIcon className="h-5 w-5 mr-3" />
                Delete chat
              </button>
            )}
          </div>
        </button>
      </div>
    </>
  );
};

export default ChatItem;
