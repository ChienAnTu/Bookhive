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
  const [loading, setLoading] = useState(true);
  const [ownersMap, setOwnersMap] = useState<Record<string, User>>({});
  const [totalBooks, setTotalBooks] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Search function
  const performSearch = async (searchParams: SearchParams) => {
    setLoading(true);
    try {
      const result = await searchBooks({
        ...searchParams,
        page: currentPage,
        pageSize,
        status: 'listed', // Only show listed books by default
      });
      setBooks(result.items);
      setTotalBooks(result.total);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function loadOwners() {
      const uniqueOwnerIds = Array.from(new Set(books.map(b => b.ownerId)));
      const results = await Promise.all(uniqueOwnerIds.map(id => getUserById(id)));
      const map: Record<string, User> = {};
      results.forEach(u => { if (u) map[u.id] = u; });
      setOwnersMap(map);
    }
    if (books.length) loadOwners();
  }, [books]);

  // Handle search when filters change
  useEffect(() => {
    const performSearch = async () => {
      setLoading(true);
      try {
        const searchParams = {
          q: searchQuery || undefined,
          lang: filters.originalLanguage || undefined,
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
          const data = await getBooks();
          setBooks(data || []);
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

  // Sort logic: old->new
  const sortedBooks = useMemo(() => {
    return [...filteredBooks].sort(
      (a, b) => new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime()
    );
  }, [filteredBooks]);

  // go to detail page
  const handleViewDetails = (bookId: string) => {
    router.push(`/books/${bookId}`);
  };

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
          books={availableBooks}
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
          ) : filteredBooks.length > 0 ? (
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
                      className={`mx-1 px-4 py-2 rounded ${
                        currentPage === i + 1
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