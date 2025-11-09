import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { updateUserAvatar } from "../api";
import { requestHandler } from "../utils";
import { UserCircleIcon, CameraIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";

const ProfilePage = () => {
  const { user, logout, setUser } = useAuth();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

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
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      {/* Header */}
      <div className="bg-[#008069] text-white px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate("/chat")}
            className="flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Back to Chat</span>
          </button>
          <h1 className="text-3xl font-semibold">Profile</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto -mt-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Avatar Section */}
          <div className="p-8 border-b border-gray-200">
            <div className="flex flex-col items-center">
              <div className="relative group">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar Preview"
                    className="w-40 h-40 rounded-full object-cover border-4 border-gray-200"
                  />
                ) : user?.avatar?.url ? (
                  <img
                    src={user.avatar.url}
                    alt="Profile Avatar"
                    className="w-40 h-40 rounded-full object-cover border-4 border-gray-200"
                  />
                ) : (
                  <UserCircleIcon className="w-40 h-40 text-gray-400" />
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 bg-[#008069] hover:bg-[#006d57] text-white rounded-full p-3 shadow-lg transition-colors"
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
                    className="bg-[#008069] hover:bg-[#006d57] text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isUploading ? "Uploading..." : "Upload Avatar"}
                  </Button>
                  <Button
                    onClick={() => {
                      setAvatarFile(null);
                      setAvatarPreview(null);
                    }}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* User Information */}
          <div className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Username
              </label>
              <p className="text-lg text-gray-900">{user?.username}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Email
              </label>
              <p className="text-lg text-gray-900">{user?.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Member Since
              </label>
              <p className="text-lg text-gray-900">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "N/A"}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="p-8 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => navigate("/chat")}
                className="w-full bg-[#008069] hover:bg-[#006d57] text-white px-6 py-3 rounded-lg transition-colors font-medium"
              >
                Back to Chats
              </Button>
              <Button
                onClick={handleLogout}
                className="w-full bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg transition-colors font-medium"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
