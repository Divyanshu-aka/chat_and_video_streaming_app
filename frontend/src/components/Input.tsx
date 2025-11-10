import React from "react";
import { classNames } from "../utils";

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (
  props
) => {
  return (
    <input
      {...props}
      className={classNames(
        "block w-full rounded-lg border border-[#393E46]/20 py-3 px-4 bg-[#EEEEEE] text-[#222831] placeholder:text-[#393E46]/60 focus:outline-none focus:ring-2 focus:ring-[#00ADB5] focus:border-transparent transition-all",
        props.className || ""
      )}
    />
  );
};

export default Input;
