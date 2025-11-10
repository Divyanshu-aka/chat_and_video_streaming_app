import {
  MessageSquare,
  Video,
  Users,
  Folder,
  Calendar,
  Settings,
} from "lucide-react";
import { useState } from "react";

interface LeftSidebarProps {
  activeTab:
    | "chats"
    | "video"
    | "contacts"
    | "folders"
    | "calendar"
    | "settings";
  onTabChange: (
    tab: "chats" | "video" | "contacts" | "folders" | "calendar" | "settings"
  ) => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({
  activeTab,
  onTabChange,
}) => {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const tabs = [
    { id: "chats", icon: MessageSquare, label: "Chats" },
    { id: "video", icon: Video, label: "Video Calls" },
    { id: "contacts", icon: Users, label: "Contacts" },
    { id: "folders", icon: Folder, label: "Folders" },
    { id: "calendar", icon: Calendar, label: "Calendar" },
  ];

  return (
    <div className="rounded-3xl pb-4 h-full flex flex-col items-center animate-float-in">
      <div className="relative flex flex-col  items-center py-6 gap-4 ">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isHovered = hoveredTab === tab.id;

          return (
            <div key={tab.id} className="relative group">
              <button
                onClick={() => onTabChange(tab.id as any)}
                onMouseEnter={() => setHoveredTab(tab.id)}
                onMouseLeave={() => setHoveredTab(null)}
                className={`
                w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ease-in-out relative
                ${
                  isActive
                    ? "bg-white shadow-xl scale-110"
                    : "bg-white/40 hover:bg-white/70 hover:shadow-lg hover:scale-105"
                }
              `}
              >
                <Icon
                  className={`w-6 h-6 transition-colors duration-200 ${
                    isActive ? "text-[#00ADB5]" : "text-[#393E46]"
                  }`}
                  strokeWidth={2}
                />
                {isActive && (
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#00ADB5] rounded-r-full"></div>
                )}
              </button>

              {/* Tooltip */}
              {isHovered && !isActive && (
                <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-[#222831] text-white text-xs px-2 py-1 rounded-md whitespace-nowrap z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {tab.label}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#222831]"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom spacer */}
      <div className="flex-1"></div>

      {/* Settings Icon at Bottom */}
      <div className="relative group ">
        <button
          onClick={() => onTabChange("settings")}
          onMouseEnter={() => setHoveredTab("settings")}
          onMouseLeave={() => setHoveredTab(null)}
          className={`
            w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ease-in-out relative
            ${
              activeTab === "settings"
                ? "bg-white shadow-xl scale-110"
                : "bg-white/40 hover:bg-white/70 hover:shadow-lg hover:scale-105"
            }
          `}
        >
          <Settings
            className={`w-6 h-6 transition-colors duration-200 ${
              activeTab === "settings" ? "text-[#00ADB5]" : "text-[#393E46]"
            }`}
            strokeWidth={2}
          />
          {activeTab === "settings" && (
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#00ADB5] rounded-r-full"></div>
          )}
        </button>

        {/* Tooltip */}
        {hoveredTab === "settings" && activeTab !== "settings" && (
          <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-[#222831] text-white text-xs px-2 py-1 rounded-md whitespace-nowrap z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            Settings
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#222831]"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeftSidebar;
