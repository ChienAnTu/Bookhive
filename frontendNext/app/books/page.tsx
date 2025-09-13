// app/books/page.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import BookCard from "../components/common/BookCard";
import { BookFilter, type BookFilters } from "../components/filters";
import { useRouter } from "next/navigation";
import type { Book } from "@/app/types/book";
import type { User } from "@/app/types/user";
import { getUserById } from "@/utils/auth";
import { getBooks } from "@/utils/books";

export default function BooksPage() {
  const [filters, setFilters] = useState<BookFilters>({
    category: "",
    originalLanguage: "",
    deliveryMethod: "",
  });

const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  // get books
  useEffect(() => {
    (async () => {
      try {
        const data = await getBooks(); // recall api
        setBooks(data || []);
      } catch (err) {
        console.error("Failed to fetch books:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleFilterChange = (key: keyof BookFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      category: "",
      originalLanguage: "",
      deliveryMethod: "",
    });
  };

  // Only get listed books for filtering and display
  const availableBooks = useMemo(() => {
    return books.filter((book) => book.status === "listed");
  }, [books]);

  // Filter logic
  const filteredBooks = useMemo(() => {
    return availableBooks.filter((book) => {
      // Category filter
      if (filters.category && book.category !== filters.category) {
        return false;
      }

      // Language filter
      if (filters.originalLanguage && book.originalLanguage !== filters.originalLanguage) {
        return false;
      }

      // Delivery Method filter
      if (
        filters.deliveryMethod &&
        book.deliveryMethod !== filters.deliveryMethod
      ) {
        return false;
      }

      return true;
    });
  }, [availableBooks, filters]);

  const router = useRouter();

  // go to detail page
  const handleViewDetails = (bookId: string) => {
    router.push(`/books/${bookId}`);
  };

  return (
    <div className="flex h-full">
      {/* Filter Sidebar */}
      <div className="hidden lg:flex lg:w-1/5 lg:min-w-48 lg:max-w-64">
        <BookFilter
          filters={filters}
          books={availableBooks}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Simple header showing results count */}
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900">
              {filteredBooks.length} books found
            </h2>
          </div>

          {/* Books grid */}
          {filteredBooks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredBooks.map((book) => {
                const owner = getUserById(book.ownerId);
                return (
                  <BookCard
                    key={book.id}
                    book={book}
                    owner={owner}
                    onViewDetails={handleViewDetails}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No books found
              </h3>
              <p className="text-gray-500 mb-2">
                Try adjusting your filters to see more results.
              </p>
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter */}
      <div className="lg:hidden">
        <BookFilter
          filters={filters}
          books={availableBooks}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />
      </div>
    </div>
  );
}