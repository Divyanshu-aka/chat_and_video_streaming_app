import { Switch } from "@headlessui/react";
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
import Input from "../Input";

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
      <div className="bg-gradient-to-r from-[#00ADB5] to-[#008c94] px-4 py-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="rounded-md text-white/90 hover:text-white focus:outline-none"
            onClick={onClose}
          >
            <span className="sr-only">Close panel</span>
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          </button>
          <h2 className="text-lg font-medium text-white">New chat</h2>
          <div className="w-6"></div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {/* Search Input */}
        <div className="p-4 border-b border-[#00ADB5]/20">
          <div className="relative">
            <input
              type="text"
              placeholder="Search name or number"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#EEEEEE] text-[#222831] placeholder-[#393E46]/60 rounded-lg px-4 py-2.5 pl-12 focus:outline-none focus:ring-2 focus:ring-[#00ADB5] text-sm border border-[#00ADB5]/20"
            />
            <svg
              className="w-5 h-5 absolute left-3 top-3 text-[#393E46]"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
          </div>
        </div>

        {/* Group Chat Toggle */}
        <div className="px-4 py-3 bg-white border-b border-[#00ADB5]/20">
          <Switch.Group as="div" className="flex items-center justify-between">
            <Switch.Label as="span" className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#00ADB5] to-[#008c94] flex items-center justify-center mr-3">
                <UserGroupIcon className="h-6 w-6 text-white" />
              </div>
              <span className="text-[#222831] font-medium">
                {isGroupChat ? "Group chat" : "New group"}
              </span>
            </Switch.Label>
            <Switch
              checked={isGroupChat}
              onChange={setIsGroupChat}
              className={classNames(
                isGroupChat ? "bg-[#00ADB5]" : "bg-gray-300",
                "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#00ADB5] focus:ring-offset-2"
              )}
            >
              <span
                aria-hidden="true"
                className={classNames(
                  isGroupChat ? "translate-x-5" : "translate-x-0",
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                )}
              />
            </Switch>
          </Switch.Group>
        </div>

        {/* Group Name Input */}
        {isGroupChat && (
          <div className="px-4 py-3 border-b border-[#00ADB5]/20">
            <Input
              placeholder="Enter group name..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>
        )}

        {/* Selected Participants */}
        {isGroupChat && groupParticipants.length > 0 && (
          <div className="px-4 py-3 bg-[#EEEEEE] border-b border-[#00ADB5]/20">
            <p className="text-sm text-[#393E46] mb-2 font-medium">
              Selected participants ({groupParticipants.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {users
                .filter((user) => groupParticipants.includes(user._id))
                .map((participant) => (
                  <div
                    key={participant._id}
                    className="inline-flex bg-white rounded-full px-3 py-1.5 border border-[#00ADB5]/20 items-center gap-2"
                  >
                    <img
                      className="h-5 w-5 rounded-full object-cover"
                      src={participant.avatar.url}
                      alt={participant.username}
                    />
                    <p className="text-sm text-[#222831]">
                      {participant.username}
                    </p>
                    <XCircleIcon
                      role="button"
                      className="w-4 h-4 text-[#393E46] hover:text-[#00ADB5] cursor-pointer"
                      onClick={() => {
                        setGroupParticipants(
                          groupParticipants.filter((p) => p !== participant._id)
                        );
                      }}
                    />
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Contacts List */}
        <div className="bg-[#EEEEEE] px-4 py-2">
          <h3 className="text-xs text-[#393E46] font-medium uppercase tracking-wider">
            Contacts on ChatStream
          </h3>
        </div>
        <div className="divide-y divide-[#00ADB5]/20">
          {filteredUsers.map((user) => {
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
                  "w-full px-4 py-3 flex items-center gap-3 hover:bg-[#00ADB5]/5 transition-colors",
                  isSelected ? "bg-[#00ADB5]/10" : "bg-white"
                )}
              >
                <img
                  className="h-12 w-12 rounded-full object-cover"
                  src={user.avatar.url}
                  alt={user.username}
                />
                <div className="flex-1 text-left">
                  <p className="text-[#222831] font-medium">{user.username}</p>
                  <p className="text-sm text-[#393E46]">{user.email}</p>
                </div>
                {isSelected && (
                  <svg
                    className="w-5 h-5 text-[#00ADB5]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer/Action Button */}
      {((isGroupChat && groupParticipants.length >= 2 && groupName) ||
        (!isGroupChat && selectedUserId)) && (
        <div className="border-t border-[#00ADB5]/20 p-4 bg-white">
          <button
            disabled={creatingChat}
            onClick={isGroupChat ? createNewGroupChat : createNewChat}
            className="w-full bg-gradient-to-r from-[#00ADB5] to-[#008c94] hover:from-[#008c94] hover:to-[#007a82] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-full transition-all flex items-center justify-center gap-2"
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {isGroupChat ? "Create Group" : "Start Chat"}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default NewChatInline;
