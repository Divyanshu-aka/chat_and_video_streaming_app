import React from "react";
import { classNames } from "../utils";

const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    fullWidth?: boolean;
    severity?: "primary" | "secondary" | "danger";
    size?: "base" | "small";
  }
> = ({ fullWidth, severity = "primary", size = "base", ...props }) => {
  return (
    <>
      <button
        {...props}
        className={classNames(
          "rounded-lg inline-flex flex-shrink-0 justify-center items-center text-center font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 shadow-sm transition-all",
          fullWidth ? "w-full" : "",
          severity === "secondary"
            ? "bg-[#EEEEEE] hover:bg-[#e0e0e0] disabled:bg-[#EEEEEE]/50 border border-[#393E46]/20 text-[#222831]"
            : severity === "danger"
            ? "bg-red-500 hover:bg-red-600 disabled:bg-red-500/50"
            : "bg-[#00ADB5] hover:bg-[#008c94] disabled:bg-[#00ADB5]/50 focus-visible:outline-[#00ADB5]",
          size === "small" ? "text-sm px-3 py-1.5" : "text-sm px-4 py-2.5",
          props.className || ""
        )}
      >
        {props.children}
      </button>
    </>
  );
};

export default Button;
