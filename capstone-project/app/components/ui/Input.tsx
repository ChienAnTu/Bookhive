import React from "react";
import { Eye, EyeOff, Search } from "lucide-react";

export type InputVariant = "default" | "search";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  variant?: InputVariant;
  leftIcon?: React.ReactNode;
  isPassword?: boolean;
}

const inputVariants = {
  default:
    "border border-gray-300 hover:border-gray-400 focus:ring-2 focus:ring-black focus:border-black",
  search:
    "border-2 border-gray-200 hover:border-gray-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-100 bg-gray-50 focus:bg-white",
};

const Input: React.FC<InputProps> = ({
  label,
  error,
  variant = "default",
  leftIcon,
  isPassword = false,
  className = "",
  type = "text",
  ...props
}) => {
  const [showPassword, setShowPassword] = React.useState(false);

  const inputType = isPassword ? (showPassword ? "text" : "password") : type;
  const variantStyles = inputVariants[variant];

  // search icon if it's search box
  const displayLeftIcon =
    variant === "search" && !leftIcon ? (
      <Search className="w-4 h-4" />
    ) : (
      leftIcon
    );

  const baseStyles =
    "w-full px-4 py-2 rounded-lg transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";
  const paddingStyles = displayLeftIcon ? "pl-10" : isPassword ? "pr-10" : "";

  const inputClasses =
    `${baseStyles} ${variantStyles} ${paddingStyles} ${className}`.trim();

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      {/* Container for input */}
      <div className="relative">
        {displayLeftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {displayLeftIcon}
          </div>
        )}

        {/* input */}
        <input type={inputType} className={inputClasses} {...props} />

        {/* password switch button */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* error message */}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Input;
