"use client";

import React, { useEffect, useState } from "react";
// 引入类型
import type { Book } from "@/app/types/book";

// 接口取数据
import { getBooks } from "@/utils/books";

import Button from "../ui/Button";
import Link from "next/link";
import SimpleBookCard from "../ui/SimpleBookCard";

// sorted by dateAdd old-new
export default function NewReleases() {
  const [newBooks, setNewBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const books = await getBooks(); // 拉全部书
        const listedBooks = books
          .filter((book) => book.status === "listed")
          .sort(
            (a, b) =>
              new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime()
          )
          .slice(0, 10);
        setNewBooks(listedBooks);
      } catch (err) {
        console.error("Failed to fetch books:", err);
        setError("Failed to load books");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="py-6">Loading books...</div>;
  }

  if (error) {
    return (
      <div className="py-6 text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Most Popular</h2>
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