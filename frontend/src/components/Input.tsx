import React from "react";
import { classNames } from "../utils";

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (
  props
) => {
  return (
    <input
      {...props}
      className={classNames(
        "block w-full rounded-lg border border-border-color py-3 px-4 bg-secondary-light text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary transition-colors",
        props.className || ""
      )}
    />
  );
};

export default Input;
