import { Dialog, Switch, Transition } from "@headlessui/react";
import {
  UserGroupIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import { Fragment, useEffect, useState } from "react";
import { createGroupChat, createUserChat, getAvailableUsers } from "../../api";
import type { ChatListItemInterface } from "../../interfaces/chat";
import type { UserInterface } from "../../interfaces/user";
import { classNames, requestHandler } from "../../utils";
import Input from "../Input";

const AddChatModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onSuccess: (chat: ChatListItemInterface) => void;
}> = ({ open, onClose, onSuccess }) => {
  // State to store the list of users, initialized as an empty array
  const [users, setUsers] = useState<UserInterface[]>([]);
  // State to store the name of a group, initialized as an empty string
  const [groupName, setGroupName] = useState("");
  // State to determine if the chat is a group chat, initialized as false
  const [isGroupChat, setIsGroupChat] = useState(false);
  // State to store the list of participants in a group chat, initialized as an empty array
  const [groupParticipants, setGroupParticipants] = useState<string[]>([]);
  // State to store the ID of a selected user, initialized as null
  const [selectedUserId, setSelectedUserId] = useState<null | string>(null);
  // State to determine if a chat is currently being created, initialized as false
  const [creatingChat, setCreatingChat] = useState(false);

  // Function to fetch users
  const getUsers = async () => {
    // Handle the request to get available users
    requestHandler(
      // Callback to fetch available users
      async () => await getAvailableUsers(),
      null, // No loading setter callback provided
      // Success callback
      (res) => {
        const { data } = res; // Extract data from response
        setUsers(data || []); // Set users data or an empty array if data is absent
      },
      alert // Use the alert as the error handler
    );
  };

  // Function to create a new chat with a user
  const createNewChat = async () => {
    // If no user is selected, show an alert
    if (!selectedUserId) return alert("Please select a user");

    // Handle the request to create a chat
    await requestHandler(
      // Callback to create a user chat
      async () => await createUserChat(selectedUserId),
      setCreatingChat, // Callback to handle loading state
      // Success callback
      (res) => {
        const { data } = res; // Extract data from response
        // If chat already exists with the selected user
        if (res.statusCode === 200) {
          alert("Chat with selected user already exists");
          return;
        }
        onSuccess(data); // Execute the onSuccess function with received data
        handleClose(); // Close the modal or popup
      },
      alert // Use the alert as the error handler
    );
  };

  // Function to create a new group chat
  const createNewGroupChat = async () => {
    // Check if a group name is provided
    if (!groupName) return alert("Group name is required");
    // Ensure there are at least 2 group participants
    if (!groupParticipants.length || groupParticipants.length < 2)
      return alert("There must be at least 2 group participants");

    // Handle the request to create a group chat
    await requestHandler(
      // Callback to create a group chat with name and participants
      async () =>
        await createGroupChat({
          name: groupName,
          participants: groupParticipants,
        }),
      setCreatingChat, // Callback to handle loading state
      // Success callback
      (res) => {
        const { data } = res; // Extract data from response
        onSuccess(data); // Execute the onSuccess function with received data
        handleClose(); // Close the modal or popup
      },
      alert // Use the alert as the error handler
    );
  };

  // Function to reset local state values and close the modal/dialog
  const handleClose = () => {
    // Clear the list of users
    setUsers([]);
    // Reset the selected user ID
    setSelectedUserId("");
    // Clear the group name
    setGroupName("");
    // Clear the group participants list
    setGroupParticipants([]);
    // Set the chat type to not be a group chat
    setIsGroupChat(false);
    // Execute the onClose callback/function
    onClose();
  };

  // useEffect hook to perform side effects based on changes in the component lifecycle or state/props
  useEffect(() => {
    // Check if the modal/dialog is not open
    if (!open) return;
    // Fetch users if the modal/dialog is open
    getUsers();
    // The effect depends on the 'open' value. Whenever 'open' changes, the effect will re-run.
  }, [open]);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 left-0 flex max-w-full">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="-translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="-translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col bg-white shadow-xl">
                    {/* Header */}
                    <div className="bg-[#008069] px-4 py-6">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          className="rounded-md text-white hover:text-gray-200 focus:outline-none"
                          onClick={handleClose}
                        >
                          <span className="sr-only">Close panel</span>
                          <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                        </button>
                        <Dialog.Title className="text-lg font-medium text-white">
                          New chat
                        </Dialog.Title>
                        <div className="w-6"></div>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto">
                      {/* Search/Input Section */}
                      <div className="p-4 border-b border-gray-200">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search name or number"
                            className="w-full bg-gray-100 text-gray-900 placeholder-gray-500 rounded-lg px-4 py-2.5 pl-12 focus:outline-none focus:ring-2 focus:ring-[#008069] text-sm"
                          />
                          <svg
                            className="w-5 h-5 absolute left-3 top-3 text-gray-500"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                          </svg>
                        </div>
                      </div>

                      {/* Group Chat Toggle */}
                      <div className="px-4 py-3 bg-white border-b border-gray-200">
                        <Switch.Group as="div" className="flex items-center justify-between">
                          <Switch.Label as="span" className="flex items-center">
                            <div className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center mr-3">
                              <UserGroupIcon className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-gray-900 font-medium">
                              {isGroupChat ? "Group chat" : "New group"}
                            </span>
                          </Switch.Label>
                          <Switch
                            checked={isGroupChat}
                            onChange={setIsGroupChat}
                            className={classNames(
                              isGroupChat ? "bg-[#25D366]" : "bg-gray-300",
                              "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#008069] focus:ring-offset-2"
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
                        <div className="px-4 py-3 border-b border-gray-200">
                          <Input
                            placeholder="Enter group name..."
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                          />
                        </div>
                      )}

                      {/* Selected Participants */}
                      {isGroupChat && groupParticipants.length > 0 && (
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                          <p className="text-sm text-gray-600 mb-2 font-medium">
                            Selected participants ({groupParticipants.length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {users
                              .filter((user) => groupParticipants.includes(user._id))
                              .map((participant) => (
                                <div
                                  key={participant._id}
                                  className="inline-flex bg-white rounded-full px-3 py-1.5 border border-gray-300 items-center gap-2"
                                >
                                  <img
                                    className="h-5 w-5 rounded-full object-cover"
                                    src={participant.avatar.url}
                                    alt={participant.username}
                                  />
                                  <p className="text-sm text-gray-900">{participant.username}</p>
                                  <XCircleIcon
                                    role="button"
                                    className="w-4 h-4 text-gray-500 hover:text-red-500 cursor-pointer"
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
                      <div className="bg-gray-50 px-4 py-2">
                        <h3 className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                          Contacts on ChatStream
                        </h3>
                      </div>
                      <div className="divide-y divide-gray-200">
                        {users.map((user) => {
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
                                "w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 transition-colors",
                                isSelected ? "bg-gray-100" : "bg-white"
                              )}
                            >
                              <img
                                className="h-12 w-12 rounded-full object-cover"
                                src={user.avatar.url}
                                alt={user.username}
                              />
                              <div className="flex-1 text-left">
                                <p className="text-gray-900 font-medium">{user.username}</p>
                                <p className="text-sm text-gray-500">{user.email}</p>
                              </div>
                              {isSelected && (
                                <svg
                                  className="w-5 h-5 text-[#25D366]"
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
                      <div className="border-t border-gray-200 p-4 bg-white">
                        <button
                          disabled={creatingChat}
                          onClick={isGroupChat ? createNewGroupChat : createNewChat}
                          className="w-full bg-[#25D366] hover:bg-[#20bd5a] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-full transition-colors flex items-center justify-center gap-2"
                        >
                          {creatingChat ? (
                            <>
                              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Creating...
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              {isGroupChat ? "Create Group" : "Start Chat"}
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default AddChatModal;
