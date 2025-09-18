"use client";

import React, { useState } from "react";

interface BookCoverProps {
  src?: string;               // img URL
  title?: string;             // alt
  className?: string;         // 允许外部传自定义样式
}

const CoverImg: React.FC<BookCoverProps> = ({ src, title, className }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className={`aspect-[4/5] w-full ${className || ""}`}>
      {src && !imgError ? (
        <img
          src={src}
          alt={title || "Book Cover"}
          className="w-full h-full object-cover block"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <span className="text-lg font-semibold text-gray-600 text-center px-2 line-clamp-2">
            {title || "Untitled"}
          </span>
        </div>
      )}
    </div>
  );
};

export default CoverImg;
