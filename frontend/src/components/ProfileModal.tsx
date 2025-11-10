import { Dialog, Transition } from "@headlessui/react";
import {
  UserCircleIcon,
  CameraIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { Fragment, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { updateUserAvatar } from "../api";
import { requestHandler } from "../utils";
import Button from "./Button";

const ProfileModal: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const { user, logout, setUser } = useAuth();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    await requestHandler(
      async () => await updateUserAvatar(avatarFile),
      setIsUploading,
      (res) => {
        alert("Avatar updated successfully!");
        setAvatarFile(null);
        setAvatarPreview(null);
        // Update user in context and local storage
        const updatedUser = res.data;
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      },
      alert
    );
  };

  const handleLogout = async () => {
    const confirmed = window.confirm("Are you sure you want to logout?");
    if (confirmed) {
      await logout();
      onClose();
    }
  };

  const handleClose = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    onClose();
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 left-0 flex max-w-full pr-10">
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
                    <div className="bg-gradient-to-r from-[#00ADB5] to-[#008c94] px-4 py-6">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          className="rounded-md text-white/90 hover:text-white focus:outline-none"
                          onClick={handleClose}
                        >
                          <span className="sr-only">Close panel</span>
                          <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                        </button>
                        <Dialog.Title className="text-lg font-medium text-white">
                          Profile
                        </Dialog.Title>
                        <div className="w-6"></div>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto">
                      {/* Avatar Section */}
                      <div className="p-8 border-b border-[#00ADB5]/20">
                        <div className="flex flex-col items-center">
                          <div className="relative group">
                            {avatarPreview ? (
                              <img
                                src={avatarPreview}
                                alt="Avatar Preview"
                                className="w-40 h-40 rounded-full object-cover border-4 border-[#00ADB5]"
                              />
                            ) : user?.avatar?.url ? (
                              <img
                                src={user.avatar.url}
                                alt="Profile Avatar"
                                className="w-40 h-40 rounded-full object-cover border-4 border-[#00ADB5]"
                              />
                            ) : (
                              <UserCircleIcon className="w-40 h-40 text-[#00ADB5]" />
                            )}
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="absolute bottom-2 right-2 bg-gradient-to-r from-[#00ADB5] to-[#008c94] hover:from-[#008c94] hover:to-[#007a82] text-white rounded-full p-3 shadow-lg transition-all"
                              title="Change Avatar"
                            >
                              <CameraIcon className="w-5 h-5" />
                            </button>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarChange}
                              className="hidden"
                            />
                          </div>

                          {avatarFile && (
                            <div className="mt-6 flex gap-3">
                              <Button
                                onClick={handleAvatarUpload}
                                disabled={isUploading}
                                className="bg-gradient-to-r from-[#00ADB5] to-[#008c94] hover:from-[#008c94] hover:to-[#007a82] text-white px-6 py-2 rounded-lg transition-all disabled:opacity-50 font-medium"
                              >
                                {isUploading ? "Uploading..." : "Upload"}
                              </Button>
                              <Button
                                onClick={() => {
                                  setAvatarFile(null);
                                  setAvatarPreview(null);
                                }}
                                className="bg-[#EEEEEE] hover:bg-[#e0e0e0] text-[#222831] px-6 py-2 rounded-lg transition-colors font-medium"
                              >
                                Cancel
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* User Information */}
                      <div className="p-6 space-y-6">
                        <div className="bg-[#EEEEEE] rounded-lg p-4 border border-[#00ADB5]/20">
                          <label className="block text-xs font-medium text-[#393E46] mb-1 uppercase tracking-wide">
                            Username
                          </label>
                          <p className="text-lg text-[#222831] font-medium">
                            {user?.username}
                          </p>
                        </div>

                        <div className="bg-[#EEEEEE] rounded-lg p-4 border border-[#00ADB5]/20">
                          <label className="block text-xs font-medium text-[#393E46] mb-1 uppercase tracking-wide">
                            Email
                          </label>
                          <p className="text-lg text-[#222831] font-medium break-all">
                            {user?.email}
                          </p>
                        </div>

                        <div className="bg-[#EEEEEE] rounded-lg p-4 border border-[#00ADB5]/20">
                          <label className="block text-xs font-medium text-[#393E46] mb-1 uppercase tracking-wide">
                            Member Since
                          </label>
                          <p className="text-lg text-[#222831] font-medium">
                            {user?.createdAt
                              ? new Date(user.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  }
                                )
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Footer/Action Button */}
                    <div className="border-t border-[#00ADB5]/20 p-4 bg-gradient-to-r from-[#EEEEEE] to-[#e0e0e0]">
                      <button
                        onClick={handleLogout}
                        className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 rounded-full transition-all flex items-center justify-center gap-2"
                      >
                        <ArrowRightOnRectangleIcon className="w-5 h-5" />
                        Logout
                      </button>
                    </div>
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

export default ProfileModal;
