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
            ? "bg-secondary-light hover:bg-secondary disabled:bg-secondary/50 border border-border-color"
            : severity === "danger"
            ? "bg-danger hover:bg-danger/80 disabled:bg-danger/50"
            : "bg-primary hover:bg-primary-dark disabled:bg-primary/50 focus-visible:outline-primary",
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
