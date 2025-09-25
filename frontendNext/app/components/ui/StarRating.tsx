"use client";

import React, { useState } from "react";
import { Star } from "lucide-react";

export interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  readonly = false,
  size = "md",
}) => {
  const [hoveredRating, setHoveredRating] = useState(0);

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isActive = star <= (hoveredRating || rating);
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            className={`${sizeClasses[size]} ${
              readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
            } transition-transform`}
            onMouseEnter={() => !readonly && setHoveredRating(star)}
            onMouseLeave={() => !readonly && setHoveredRating(0)}
            onClick={() => !readonly && onRatingChange?.(star)}
          >
            <Star
              className={`w-full h-full ${
                isActive ? "text-yellow-400" : "text-gray-300"
              }`}
              fill={isActive ? "currentColor" : "none"}
              stroke="currentColor"
            />
          </button>
        );
      })}
      {!readonly && (
        <span className="text-sm text-gray-600 ml-2">
          {hoveredRating || rating}/5
        </span>
      )}
    </div>
  );
};

export default StarRating;
