import React from "react";
import type { User } from "@/app/types/user";

interface AvatarProps {
  user: {
    firstName?: string;
    lastName?: string;
    name?: string | null;
    avatar?: string;
    profilePicture?: string;
  };
  size?: number; // 40px
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ user, size = 40, className }) => {
  const displayName =
    ([user.firstName, user.lastName].filter(Boolean).join(" ") || user.name || "User").trim();

  const src =
    user.profilePicture || // upload avatar
    user.avatar || // default avatar
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      displayName
    )}&background=FF6801&color=fff&bold=true&size=${size}`;

  return (
    <img
      src={src}
      alt={displayName}
      className={`rounded-full object-cover ${className || ""}`}
      style={{ width: size, height: size }}
    />
  );
};

export default Avatar;
