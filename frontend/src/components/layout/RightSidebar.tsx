import {
  X,
  ChevronDown,
  ChevronUp,
  Image,
  Link,
  Paperclip,
  Camera,
  Mic,
  Palette,
  Clock,
  Archive,
  Users as UsersIcon,
} from "lucide-react";
import { useState } from "react";

interface RightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const RightSidebar: React.FC<RightSidebarProps> = ({ isOpen, onClose }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "files"
  );

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (!isOpen) return null;

  return (
    <div className="w-80 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-[#00ADB5]/20 flex flex-col overflow-hidden animate-slide-in mr-4 my-4 hover:shadow-[0_25px_50px_-12px_rgba(0,173,181,0.2)] transition-shadow duration-500">
      {/* Header */}
      <div className="p-4 border-b border-[#00ADB5]/20 flex items-center justify-between bg-gradient-to-r from-[#00ADB5] to-[#008c94] rounded-t-3xl">
        <h2 className="text-lg font-semibold text-white">Details</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Chat Files Section */}
        <div className="bg-white backdrop-blur-md rounded-2xl shadow-lg border border-[#00ADB5]/20 overflow-hidden transition-all duration-300">
          <button
            onClick={() => toggleSection("files")}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#00ADB5]/5 transition-colors"
          >
            <span className="font-semibold text-[#222831] flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-[#00ADB5]" />
              Chat Files
            </span>
            {expandedSection === "files" ? (
              <ChevronUp className="w-5 h-5 text-[#393E46]" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[#393E46]" />
            )}
          </button>

          {expandedSection === "files" && (
            <div className="px-4 pb-4 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-[#222831]">
                  <Image className="w-4 h-4 text-[#00ADB5]" />
                  <span>128 Photos</span>
                </div>
                <ChevronDown className="w-4 h-4 text-[#393E46]" />
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-[#222831]">
                  <Link className="w-4 h-4 text-[#00ADB5]" />
                  <span>15 Links</span>
                </div>
                <ChevronDown className="w-4 h-4 text-[#393E46]" />
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-[#222831]">
                  <Paperclip className="w-4 h-4 text-[#00ADB5]" />
                  <span>72 Attachments</span>
                </div>
                <ChevronDown className="w-4 h-4 text-[#393E46]" />
              </div>
            </div>
          )}
        </div>

        {/* Reminders Section */}
        <div className="bg-white backdrop-blur-md rounded-2xl shadow-lg border border-[#00ADB5]/20 overflow-hidden transition-all duration-300">
          <button
            onClick={() => toggleSection("reminders")}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#00ADB5]/5 transition-colors"
          >
            <span className="font-semibold text-[#222831] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#00ADB5]" />
              Reminders
            </span>
            {expandedSection === "reminders" ? (
              <ChevronUp className="w-5 h-5 text-[#393E46]" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[#393E46]" />
            )}
          </button>

          {expandedSection === "reminders" && (
            <div className="px-4 pb-4 space-y-2 animate-fade-in">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4 rounded border-[#393E46]/30 text-[#00ADB5] focus:ring-[#00ADB5]"
                />
                <span className="text-sm text-[#222831]">
                  Design Meeting @ 10:30
                </span>
              </div>
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4 rounded border-[#393E46]/30 text-[#00ADB5] focus:ring-[#00ADB5]"
                />
                <span className="text-sm text-[#222831]">
                  Email Derrick about Sco...
                </span>
              </div>
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4 rounded border-[#393E46]/30 text-[#00ADB5] focus:ring-[#00ADB5]"
                />
                <span className="text-sm text-[#222831]">
                  Create new group for s...
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Tool Box Section */}
        <div className="bg-white backdrop-blur-md rounded-2xl shadow-lg border border-[#00ADB5]/20 overflow-hidden transition-all duration-300">
          <button
            onClick={() => toggleSection("toolbox")}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#00ADB5]/5 transition-colors"
          >
            <span className="font-semibold text-[#222831] flex items-center gap-2">
              <svg
                className="w-4 h-4 text-[#00ADB5]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Tool Box
            </span>
            {expandedSection === "toolbox" ? (
              <ChevronUp className="w-5 h-5 text-[#393E46]" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[#393E46]" />
            )}
          </button>

          {expandedSection === "toolbox" && (
            <div className="px-4 pb-4 animate-fade-in">
              <div className="grid grid-cols-3 gap-3">
                <button className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-[#00ADB5]/5 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00ADB5]/20 to-[#00ADB5]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UsersIcon className="w-5 h-5 text-[#00ADB5]" />
                  </div>
                  <span className="text-xs text-[#393E46]">Contacts</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-[#00ADB5]/5 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00ADB5]/20 to-[#00ADB5]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Camera className="w-5 h-5 text-[#00ADB5]" />
                  </div>
                  <span className="text-xs text-[#393E46]">Camera</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-[#00ADB5]/5 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00ADB5]/20 to-[#00ADB5]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Mic className="w-5 h-5 text-[#00ADB5]" />
                  </div>
                  <span className="text-xs text-[#393E46]">Microphone</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-[#00ADB5]/5 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00ADB5]/20 to-[#00ADB5]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Image className="w-5 h-5 text-[#00ADB5]" />
                  </div>
                  <span className="text-xs text-[#393E46]">Background</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-[#00ADB5]/5 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00ADB5]/20 to-[#00ADB5]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Palette className="w-5 h-5 text-[#00ADB5]" />
                  </div>
                  <span className="text-xs text-[#393E46]">Theme</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-[#00ADB5]/5 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00ADB5]/20 to-[#00ADB5]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Clock className="w-5 h-5 text-[#00ADB5]" />
                  </div>
                  <span className="text-xs text-[#393E46]">Time Zone</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-[#00ADB5]/5 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00ADB5]/20 to-[#00ADB5]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Archive className="w-5 h-5 text-[#00ADB5]" />
                  </div>
                  <span className="text-xs text-[#393E46]">Archive</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
