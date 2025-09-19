import React from "react";

export default function Button({ children, className = "", ...props }) {
  return (
    <button
      className={`rounded-full px-4 py-2 font-medium transition-colors ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}