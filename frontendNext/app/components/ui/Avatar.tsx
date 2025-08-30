import React from "react";
import type { User } from "@/app/types/user";

interface AvatarProps {
  user: User;
  size?: number; // 默认 40px
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ user, size = 40, className }) => {
  const src =
    user.profilePicture || // 本地上传的优先
    user.avatar || // 后端 API 的头像
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      `${user.firstName} ${user.lastName}`
    )}&background=FF6801&color=fff&bold=true&size=${size}`;

  return (
    <img
      src={src}
      alt={`${user.firstName} ${user.lastName}`}
      className={`rounded-full object-cover ${className || ""}`}
      style={{ width: size, height: size }}
    />
  );
};

export default Avatar;
