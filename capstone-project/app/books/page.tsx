"use client";

// import React, { useState } from "react";
import BookCard from "../components/common/BookCard";
import { mockBooks } from "../data/mockData";


export default function BooksPage() {
  const handleViewDetails = (bookId: string) => {
    // 跳转到书籍详情页
    window.location.href = `/books/${bookId}`;
  };

  return (
    <div className="bg-gray-50 py-6">
      {/* 减少两侧留白：从 px-4 sm:px-6 lg:px-8 改为 px-2 sm:px-3 lg:px-4 */}
      <div className="w-full px-2 sm:px-3 lg:px-4">
        {/* 只保留书籍数量显示 */}
        <div className="mb-6">
          <p className="text-gray-600 text-sm">
            {mockBooks.length} books found
          </p>
        </div>

        {/* 书籍网格 - 调整间距 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {mockBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
