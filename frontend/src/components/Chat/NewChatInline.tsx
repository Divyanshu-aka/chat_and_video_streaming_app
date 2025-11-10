import {
  UserGroupIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import { useEffect, useState } from "react";
import { createGroupChat, createUserChat, getAvailableUsers } from "../../api";
import type { ChatListItemInterface } from "../../interfaces/chat";
import type { UserInterface } from "../../interfaces/user";
import { classNames, requestHandler } from "../../utils";

const NewChatInline: React.FC<{
  onClose: () => void;
  onSuccess: (chat: ChatListItemInterface) => void;
}> = ({ onClose, onSuccess }) => {
  const [users, setUsers] = useState<UserInterface[]>([]);
  const [groupName, setGroupName] = useState("");
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [groupParticipants, setGroupParticipants] = useState<string[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<null | string>(null);
  const [creatingChat, setCreatingChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const getUsers = async () => {
    requestHandler(
      async () => await getAvailableUsers(),
      null,
      (res) => {
        const { data } = res;
        setUsers(data || []);
      },
      alert
    );
  };

  const createNewChat = async () => {
    if (!selectedUserId) return alert("Please select a user");

    await requestHandler(
      async () => await createUserChat(selectedUserId),
      setCreatingChat,
      (res) => {
        const { data } = res;
        if (res.statusCode === 200) {
          alert("Chat with selected user already exists");
          return;
        }
        onSuccess(data);
      },
      alert
    );
  };

  const createNewGroupChat = async () => {
    if (!groupName) return alert("Group name is required");
    if (!groupParticipants.length || groupParticipants.length < 2)
      return alert("There must be at least 2 group participants");

    await requestHandler(
      async () =>
        await createGroupChat({
          name: groupName,
          participants: groupParticipants,
        }),
      setCreatingChat,
      (res) => {
        const { data } = res;
        onSuccess(data);
      },
      alert
    );
  };

  useEffect(() => {
    getUsers();
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col bg-white animate-slideInFromLeft">
      {/* Header */}
      <div className="px-4 py-4 border-b border-[#00ADB5]/20 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-[#222831]">New Chat</h2>
          <button
            type="button"
            className="rounded-full p-1.5 text-[#393E46] hover:bg-[#00ADB5]/10 hover:text-[#00ADB5] transition-colors focus:outline-none"
            onClick={onClose}
          >
            <span className="sr-only">Close panel</span>
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#EEEEEE] text-[#222831] placeholder-[#393E46]/60 rounded-lg px-4 py-2.5 pl-10 focus:outline-none focus:ring-2 focus:ring-[#00ADB5] text-sm border border-transparent focus:border-[#00ADB5]/30 transition-all"
          />
          <svg
            className="w-4 h-4 absolute left-3 top-3.5 text-[#393E46]"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
        </div>
      </div>

      {/* Create Group Button - Only show when NOT in group mode */}
      {!isGroupChat && (
        <div className="px-4 py-3 bg-[#EEEEEE]/50">
          <button
            onClick={() => {
              setIsGroupChat(true);
              setSelectedUserId(null);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all bg-white text-[#222831] hover:bg-[#00ADB5]/5 border border-[#00ADB5]/20"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center transition-colors bg-gradient-to-r from-[#00ADB5] to-[#008c94]">
              <UserGroupIcon className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-[#222831]">Create Group</p>
              <p className="text-xs text-[#393E46]">
                Chat with multiple people
              </p>
            </div>
            <svg
              className="w-5 h-5 text-[#393E46]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Selected Participants */}
      {isGroupChat && groupParticipants.length > 0 && (
        <div className="px-4 py-3 bg-[#00ADB5]/5 border-b border-[#00ADB5]/20">
          <p className="text-xs font-semibold text-[#00ADB5] mb-2 uppercase tracking-wide">
            {groupParticipants.length} Member
            {groupParticipants.length > 1 ? "s" : ""} Selected
          </p>
          <div className="flex flex-wrap gap-2">
            {users
              .filter((user) => groupParticipants.includes(user._id))
              .map((participant) => (
                <div
                  key={participant._id}
                  className="inline-flex bg-white rounded-full pl-1 pr-3 py-1 border border-[#00ADB5]/30 items-center gap-2 shadow-sm"
                >
                  <img
                    className="h-6 w-6 rounded-full object-cover ring-2 ring-[#00ADB5]/20"
                    src={participant.avatar.url}
                    alt={participant.username}
                  />
                  <p className="text-sm text-[#222831] font-medium">
                    {participant.username}
                  </p>
                  <button
                    onClick={() => {
                      setGroupParticipants(
                        groupParticipants.filter((p) => p !== participant._id)
                      );
                    }}
                    className="hover:bg-red-50 rounded-full p-0.5 transition-colors"
                  >
                    <XCircleIcon className="w-4 h-4 text-red-500 hover:text-red-600" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Body - Contacts List */}
      <div className="flex-1 overflow-y-auto">
        {/* Section Header */}
        <div className="bg-[#EEEEEE] px-4 py-2.5 sticky top-0 z-10">
          <h3 className="text-xs text-[#393E46] font-semibold uppercase tracking-wider">
            {filteredUsers.length} Contact
            {filteredUsers.length !== 1 ? "s" : ""} Available
          </h3>
        </div>

        {/* Contacts */}
        <div className="">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => {
              const isSelected = isGroupChat
                ? groupParticipants.includes(user._id)
                : selectedUserId === user._id;

              return (
                <button
                  key={user._id}
                  onClick={() => {
                    if (isGroupChat) {
                      if (groupParticipants.includes(user._id)) {
                        setGroupParticipants(
                          groupParticipants.filter((p) => p !== user._id)
                        );
                      } else {
                        setGroupParticipants([...groupParticipants, user._id]);
                      }
                    } else {
                      setSelectedUserId(user._id);
                    }
                  }}
                  className={classNames(
                    "w-full px-4 py-3.5 flex items-center gap-3 hover:bg-[#00ADB5]/5 transition-all duration-200",
                    isSelected ? "bg-[#00ADB5]/10" : "bg-white"
                  )}
                >
                  <div className="relative">
                    <img
                      className={classNames(
                        "h-12 w-12 rounded-full object-cover transition-all",
                        isSelected ? "ring-2 ring-[#00ADB5]" : ""
                      )}
                      src={user.avatar.url}
                      alt={user.username}
                    />
                    {isSelected && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-[#00ADB5] rounded-full flex items-center justify-center ring-2 ring-white">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-[#222831] font-semibold">
                      {user.username}
                    </p>
                    <p className="text-xs text-[#393E46] mt-0.5">
                      {user.email}
                    </p>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[#EEEEEE] flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-[#393E46]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <p className="text-[#393E46] font-medium">No contacts found</p>
              <p className="text-xs text-[#393E46]/70 mt-1">
                Try a different search term
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer/Action Button */}
      {isGroupChat ? (
        /* Group Chat Creation Footer */
        <div className="border-t border-[#00ADB5]/20 p-4 bg-white shadow-lg">
          {/* Group Name Input - Message-like */}
          <div className="flex items-end gap-2 mb-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Enter group name..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full bg-[#EEEEEE] text-[#222831] placeholder-[#393E46]/60 rounded-2xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-[#00ADB5] text-sm border border-transparent focus:border-[#00ADB5]/30 transition-all"
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    groupName &&
                    groupParticipants.length >= 2 &&
                    !creatingChat
                  ) {
                    createNewGroupChat();
                  }
                }}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {groupName && (
                  <button
                    onClick={() => setGroupName("")}
                    className="p-1 hover:bg-white/50 rounded-full transition-colors"
                  >
                    <XCircleIcon className="w-4 h-4 text-[#393E46]" />
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                setIsGroupChat(false);
                setGroupParticipants([]);
                setGroupName("");
              }}
              className="p-3 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
              title="Cancel group creation"
            >
              <XMarkIcon className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Status Messages */}
          <div className="mb-2 text-center min-h-[20px]">
            {!groupName && (
              <p className="text-xs text-[#393E46]">
                Enter a group name to continue
              </p>
            )}
            {groupName && groupParticipants.length < 2 && (
              <p className="text-xs text-[#393E46]">
                Select at least 2 members
              </p>
            )}
            {groupName && groupParticipants.length >= 2 && (
              <p className="text-xs text-[#00ADB5] font-medium">
                ✓ Ready to create group!
              </p>
            )}
          </div>

          {/* Create Group Button */}
          <button
            disabled={
              creatingChat || !groupName || groupParticipants.length < 2
            }
            onClick={createNewGroupChat}
            className="w-full bg-gradient-to-r from-[#00ADB5] to-[#008c94] hover:from-[#008c94] hover:to-[#007a82] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#00ADB5]/30 hover:shadow-xl hover:shadow-[#00ADB5]/40"
          >
            {creatingChat ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Creating...
              </>
            ) : (
              <>
                <UserGroupIcon className="w-5 h-5" />
                Create Group Chat
              </>
            )}
          </button>
        </div>
      ) : (
        /* Individual Chat Creation Footer */
        selectedUserId && (
          <div className="border-t border-[#00ADB5]/20 p-4 bg-white shadow-lg">
            <button
              disabled={creatingChat}
              onClick={createNewChat}
              className="w-full bg-gradient-to-r from-[#00ADB5] to-[#008c94] hover:from-[#008c94] hover:to-[#007a82] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#00ADB5]/30 hover:shadow-xl hover:shadow-[#00ADB5]/40"
            >
              {creatingChat ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  Start Conversation
                </>
              )}
            </button>
          </div>
        )
      )}
    </div>
  );
};

export default NewChatInline;
