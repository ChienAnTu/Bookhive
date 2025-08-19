import React from "react";

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className = "",
  hover = false,
  padding = true,
}) => {
  const baseStyles = "bg-white rounded-xl border border-gray-200"; // 淡灰色边框，更圆的角

  // 微妙的悬停效果
  const hoverStyles = hover
    ? "hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all duration-200 cursor-pointer"
    : "";

  const paddingStyles = padding ? "p-4" : ""; // 稍微减少内边距

  const cardClasses =
    `${baseStyles} ${hoverStyles} ${paddingStyles} ${className}`.trim();

  return <div className={cardClasses}>{children}</div>;
};

export default Card;
