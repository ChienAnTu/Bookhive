import React from "react";
// 引入类型
import type { Book } from "@/app/types/book";

// 引入数据
import { mockBooks } from "@/app/data/mockData";

import Button from "../ui/Button";
import Link from "next/link";
import SimpleBookCard from "../ui/SimpleBookCard";

// sorted by dateAdd
const getNewReleases = (): Book[] => {
  return mockBooks
    .filter((book) => book.status === "listed")
    .sort(
      (a, b) =>
        new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
    )
    .slice(0, 10);
};

// New Releases
export default function NewReleases() {
  const newBooks = getNewReleases();

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">New Releases</h2>
        <Link href="/books">
          <Button className="text-sm">See All</Button>
        </Link>
      </div>

      <div className="flex space-x-4 overflow-x-auto pb-2">
        {newBooks.map((book) => (
          <Link key={book.id} href={`/books/${book.id}`} className="block">
            <SimpleBookCard book={book} />
          </Link>
        ))}
      </div>
    </div>
  );
}
