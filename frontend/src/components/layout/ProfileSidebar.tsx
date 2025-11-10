import { XCircleIcon } from "@heroicons/react/20/solid";
import type { UserInterface } from "../../interfaces/user";

interface ProfileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserInterface | null;
  onEditProfile: () => void;
  onLogout: () => void;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  isOpen,
  onClose,
  user,
  onEditProfile,
  onLogout,
}) => {
  return (
    <div
      className={`absolute inset-0 z-50 transition-all duration-500 ease-out pointer-events-none ${
        isOpen ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-500 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Profile Sidebar */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-80 bg-white shadow-2xl transition-all duration-500 ease-out ${
          isOpen ? "translate-x-0 pointer-events-auto" : "-translate-x-full"
        }`}
        style={{
          transformOrigin: "right center",
          clipPath: isOpen
            ? "circle(150% at -20% 0%)"
            : "circle(0% at -20% 0%)",
        }}
      >
        {/* Profile Header */}
        <div className="bg-gradient-to-br from-[#00ADB5] to-[#008c94] p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <XCircleIcon className="w-6 h-6 text-white" />
          </button>

          <div className="flex flex-col items-center mt-8">
            <div className="relative">
              <img
                src={user?.avatar?.url || "https://via.placeholder.com/100"}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
              <div className="absolute bottom-1 right-1 w-5 h-5 bg-[#00ADB5] rounded-full border-4 border-white"></div>
            </div>
            <h2 className="text-white text-2xl font-bold mt-4">
              {user?.username || "User"}
            </h2>
            <p className="text-white/80 text-sm mt-1">
              {user?.email || "email@example.com"}
            </p>
          </div>
        </div>

        {/* Profile Content */}
        <div
          className="p-6 overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 250px)" }}
        >
          {/* Profile Options */}
          <div className="space-y-2">
            <button
              onClick={() => {
                onClose();
                onEditProfile();
              }}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-[#00ADB5]/5 transition-colors text-left"
            >
              <div className="p-2 rounded-full bg-[#00ADB5]/10">
                <svg
                  className="w-6 h-6 text-[#00ADB5]"
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
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[#222831]">Edit Profile</h3>
                <p className="text-sm text-[#393E46]">
                  Update your information
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
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            <button className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-[#00ADB5]/5 transition-colors text-left">
              <div className="p-2 rounded-full bg-[#00ADB5]/10">
                <svg
                  className="w-6 h-6 text-[#00ADB5]"
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
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[#222831]">Settings</h3>
                <p className="text-sm text-[#393E46]">Manage preferences</p>
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
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            <button className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-[#00ADB5]/5 transition-colors text-left">
              <div className="p-2 rounded-full bg-[#00ADB5]/10">
                <svg
                  className="w-6 h-6 text-[#00ADB5]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[#222831]">Help & Support</h3>
                <p className="text-sm text-[#393E46]">Get assistance</p>
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
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Divider */}
          <div className="my-6 border-t border-[#00ADB5]/20"></div>

          {/* Logout Button */}
          <button
            onClick={async () => {
              onClose();
              const confirmed = window.confirm(
                "Are you sure you want to logout?"
              );
              if (confirmed) {
                await onLogout();
              }
            }}
            className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-red-50 transition-colors text-left"
          >
            <div className="p-2 rounded-full bg-red-100">
              <svg
                className="w-6 h-6 text-red-600"
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
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-600">Logout</h3>
              <p className="text-sm text-[#393E46]">Sign out of your account</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSidebar;
