"use client";

import React from "react";
import type { Book } from "@/app/types/book";
import Link from "next/link";

export default function BookThumbnailCard({ book }: { book: Book }) {
  return (
    <Link href={`/books/${book.id}`} className="block w-32 sm:w-40 flex-shrink-0">
      <div className="group cursor-pointer">
        {/* 封面 */}
        <div className="w-full aspect-[3/4] overflow-hidden rounded-lg bg-gray-100">
          {book.coverImgUrl ? (
            <img
              src={book.coverImgUrl}
              alt={book.titleOr}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
              No Cover
            </div>
          )}
        </div>

        {/* 标题 + 作者 */}
        <div className="mt-2">
          <div className="text-sm font-medium text-black line-clamp-2">{book.titleOr}</div>
        </div>
      </div>
    </Link>
  );
}
