// app/books/page.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import BookCard from "../components/common/BookCard";
import { BookFilter, type BookFilters } from "../components/filters";
import { useRouter, useSearchParams } from "next/navigation";
import type { Book } from "@/app/types/book";
import type { User } from "@/app/types/user";
import { getUserById } from "@/utils/auth";
import { getBooks } from "@/utils/books";
import { searchBooks, type SearchParams } from "@/utils/books";

export default function BooksPage() {

  const urlSearchParams = useSearchParams();
  const searchQuery = urlSearchParams.get('q');

  const [filters, setFilters] = useState<BookFilters>({
    category: "",
    originalLanguage: "",
    deliveryMethod: "",
  });

  const [books, setBooks] = useState<Book[]>([]);
  const [allBooks, setAllBooks] = useState<Book[]>([]); // For filter options
  const [loading, setLoading] = useState(true);
  const [totalBooks, setTotalBooks] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Load all books once for filter options
  useEffect(() => {
    const loadAllBooks = async () => {
      try {
        const data = await getBooks({ status: 'listed' });
        setAllBooks(data || []);
      } catch (err) {
        console.error("Failed to fetch all books:", err);
      }
    };
    loadAllBooks();
  }, []);

  // Handle search when filters change
  useEffect(() => {
    const performSearch = async () => {
      setLoading(true);
      try {
        const searchParams = {
          q: searchQuery || undefined,
          lang: filters.originalLanguage || undefined,
          category: filters.category || undefined,
          delivery: filters.deliveryMethod as SearchParams['delivery'] || undefined,
          page: currentPage,
          pageSize: 20,
          status: 'listed' as const
        };

        const result = await searchBooks(searchParams);
        setBooks(result.items || []);
        setTotalBooks(result.total || 0);
      } catch (error) {
        console.error('Search failed:', error);
        setBooks([]);
        setTotalBooks(0);
      } finally {
        setLoading(false);
      }
    };

    // Only perform search if there are search parameters or filters
    if (searchQuery || Object.values(filters).some(value => value !== "")) {
      performSearch();
    } else {
      // If no search parameters, fetch default books
      (async () => {
        try {
          const data = await getBooks({ status: 'listed' });
          setBooks(data || []);
          setTotalBooks(data?.length || 0);
        } catch (err) {
          console.error("Failed to fetch books:", err);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [searchQuery, filters, currentPage]);

  const handleFilterChange = (key: keyof BookFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handleClearFilters = () => {
    setFilters({
      category: "",
      originalLanguage: "",
      deliveryMethod: "",
    });
    setCurrentPage(1);
  };




  const router = useRouter();

  // Sort logic: old->new
  const sortedBooks = useMemo(() => {
    return [...books].sort(
      (a, b) => new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime()
    );
  }, [books]);

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  return (
    <div className="flex h-full">
      {/* Filter Sidebar */}
      <div className="hidden lg:flex lg:w-1/5 lg:min-w-48 lg:max-w-64">
        <BookFilter
          filters={filters}
          books={allBooks}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Results count and loading state */}
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900">
              {loading ? 'Loading...' : `${totalBooks} books found`}
            </h2>
          </div>

          {/* Books grid */}
          {loading ? (
            <div className="text-center py-20">Loading books...</div>
          ) : books.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sortedBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onViewDetails={(id) => router.push(`/books/${id}`)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalBooks > pageSize && (
                <div className="mt-8 flex justify-center">
                  {Array.from({ length: Math.ceil(totalBooks / pageSize) }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => handlePageChange(i + 1)}
                      className={`mx-1 px-4 py-2 rounded ${currentPage === i + 1
                        ? 'bg-black text-white'
                        : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
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
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-700"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}