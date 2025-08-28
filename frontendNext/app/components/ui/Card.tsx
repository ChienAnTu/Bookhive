import React from "react";

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className = "",
  hover = false,
  padding = true,
  onClick,
}) => {
  const baseClasses = "bg-white rounded-xl overflow-hidden";

  const hoverClasses = hover
    ? "hover:bg-blue-50 transition-all duration-300 cursor-pointer"
    : "";
  const paddingClasses = padding ? "p-4" : "";
  const clickableClasses = onClick ? "cursor-pointer" : "";

  const cardClasses =
    `${baseClasses} ${hoverClasses} ${paddingClasses} ${clickableClasses} ${className}`.trim();

  return (
    <div className={cardClasses} onClick={onClick}>
      {children}
    </div>
  );
};

export default Card;