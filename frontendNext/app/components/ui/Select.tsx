"use client";

import React from "react";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

const Select: React.FC<SelectProps> = ({
  label,
  error,
  className = "",
  children,
  ...props
}) => {
  const baseStyles =
    "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black";

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      <select className={`${baseStyles} ${className}`} {...props}>
        {children}
      </select>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Select;
