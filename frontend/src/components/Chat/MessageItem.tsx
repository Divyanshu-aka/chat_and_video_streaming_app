import {
  ArrowDownTrayIcon,
  EllipsisVerticalIcon,
  MagnifyingGlassPlusIcon,
  PaperClipIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import moment from "moment";
import { useState } from "react";
import type { ChatMessageInterface } from "../../interfaces/chat";
import { classNames } from "../../utils";

const MessageItem: React.FC<{
  isOwnMessage?: boolean;
  isGroupChatMessage?: boolean;
  message: ChatMessageInterface;
  deleteChatMessage: (message: ChatMessageInterface) => void;
}> = ({ message, isOwnMessage, isGroupChatMessage, deleteChatMessage }) => {
  const [resizedImage, setResizedImage] = useState<string | null>(null);
  const [openOptions, setopenOptions] = useState<boolean>(false);

  return (
    <>
      {resizedImage ? (
        <div className="h-full z-40 p-8 overflow-hidden w-full absolute inset-0 bg-black/90 flex justify-center items-center">
          <XMarkIcon
            className="absolute top-5 right-5 w-9 h-9 text-white cursor-pointer hover:text-text-secondary"
            onClick={() => setResizedImage(null)}
          />
          <img
            className="w-full h-full object-contain"
            src={resizedImage}
            alt="chat image"
          />
        </div>
      ) : null}
      <div
        className={classNames(
          "flex items-end gap-1 max-w-md",
          isOwnMessage ? "ml-auto flex-row-reverse" : "mr-auto"
        )}
      >
        {!isOwnMessage && isGroupChatMessage && (
          <img
            src={message.sender?.avatar?.url}
            className="h-7 w-7 object-cover rounded-full flex-shrink-0 mb-0.5"
            alt={message.sender?.username}
          />
        )}
        <div
          onMouseLeave={() => setopenOptions(false)}
          className={classNames(
            "px-2 py-1.5 rounded-lg flex flex-col relative group shadow-sm",
            isOwnMessage
              ? "bg-[#d9fdd3] rounded-tr-none"
              : "bg-white rounded-tl-none"
          )}
        >
          {isGroupChatMessage && !isOwnMessage ? (
            <p className="text-xs font-semibold mb-0.5 text-[#00a884]">
              {message.sender?.username}
            </p>
          ) : null}

          {message?.attachments?.length > 0 ? (
            <div className="mb-1">
              <div
                className={classNames(
                  "grid gap-0.5",
                  message.attachments?.length === 1 ? "grid-cols-1" : "",
                  message.attachments?.length === 2 ? "grid-cols-2" : "",
                  message.attachments?.length >= 3 ? "grid-cols-2" : ""
                )}
              >
                {message.attachments?.map((file) => {
                  return (
                    <div
                      key={file._id}
                      className="group/img relative rounded overflow-hidden cursor-pointer"
                      style={{ maxWidth: "250px" }}
                    >
                      <button
                        onClick={() => setResizedImage(file.url)}
                        className="absolute inset-0 z-20 flex justify-center items-center gap-2 bg-black/50 group-hover/img:opacity-100 opacity-0 transition-opacity"
                      >
                        <MagnifyingGlassPlusIcon className="h-6 w-6 text-white" />
                        <a
                          href={file.url}
                          download
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ArrowDownTrayIcon className="hover:text-zinc-300 h-6 w-6 text-white cursor-pointer" />
                        </a>
                      </button>
                      <img
                        className="w-full object-cover rounded"
                        src={file.url}
                        alt="attachment"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {message.content ? (
            <p className="text-[14.2px] text-[#111b21] break-words whitespace-pre-wrap leading-[19px]">
              {message.content}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-1 mt-0.5 ml-2">
            {message.attachments?.length > 0 && (
              <PaperClipIcon className="h-3 w-3 text-[#667781]" />
            )}
            <span className="text-[11px] text-[#667781]">
              {moment(message.updatedAt).format("HH:mm")}
            </span>
            {isOwnMessage && (
              <svg className="w-[18px] h-[18px] text-[#53bdeb]" viewBox="0 0 16 15" fill="none">
                <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267a.32.32 0 0 0 .484-.034l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.032L1.892 7.77a.366.366 0 0 0-.516.005l-.423.433a.364.364 0 0 0 .006.514l3.255 3.185a.32.32 0 0 0 .484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" fill="currentColor"/>
              </svg>
            )}
          </div>

          {isOwnMessage && (
            <button
              className="absolute -left-8 top-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setopenOptions(!openOptions)}
            >
              <EllipsisVerticalIcon className="w-5 h-5 text-[#8696a0]" />
            </button>
          )}

          {openOptions && isOwnMessage && (
            <div className="absolute -left-32 top-0 bg-white rounded-md shadow-xl p-1 z-30">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const ok = confirm("Are you sure you want to delete this message?");
                  if (ok) {
                    deleteChatMessage(message);
                  }
                }}
                className="px-3 py-2 text-[#3b4a54] rounded w-full inline-flex items-center hover:bg-[#f5f6f6] text-sm whitespace-nowrap"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MessageItem;
