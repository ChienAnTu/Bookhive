import React from "react";
// Import types 
import type { Book } from "@/app/types/book"; 

import Card from "./Card";

interface SimpleBookCardProps {
  book: Book;
}

// Simple book card component
export default function SimpleBookCard({ book }: SimpleBookCardProps) {
  return (
    <Card className="flex-shrink-0 w-[clamp(180px,20vw,240px)] hover:shadow-lg transition-shadow">
      <div className="w-full aspect-[3/4] bg-gray-200 rounded-lg overflow-hidden mb-3">
        <img
          src={book.coverImgUrl}
          alt={book.titleOr}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="px-2 pb-2">
        <h4 className="text-base font-medium text-gray-900 line-clamp-2 leading-snug">
          {book.titleOr}
        </h4>
      </div>
    </Card>
  );
}
