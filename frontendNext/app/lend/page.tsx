// app/lend/page.tsx
"use client";

import { useState, useMemo } from "react";
import { Search, Filter, Clock, CheckCircle, XCircle, BookOpen } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { mockLendingItems } from "@/app/data/mockData";
import { LendingItem, FilterStatus, LendingStatus } from "@/app/types/lending";

export default function LendingListPage() {
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<FilterStatus>("all");

  const filteredBooks = useMemo(() => {
    let filtered = mockLendingItems;
    if (selectedFilter !== "all") {
      filtered = filtered.filter((b: LendingItem) => b.status === selectedFilter);
    }
    if (search) {
      filtered = filtered.filter((b: LendingItem) =>
        b.title.toLowerCase().includes(search.toLowerCase())
      );
    }
    return filtered;
  }, [search, selectedFilter]);

  const filterOptions = [
    { value: "all", label: "All", count: mockLendingItems.length },
    { value: "Listed", label: "Listed", count: mockLendingItems.filter((b: LendingItem) => b.status === "Listed").length },
    { value: "Unlisted", label: "Unlisted", count: mockLendingItems.filter((b: LendingItem) => b.status === "Unlisted").length },
    { value: "LendOut", label: "Lend Out", count: mockLendingItems.filter((b: LendingItem) => b.status === "LendOut").length },
  ];

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Lending List</h1>
              <p className="text-gray-600">Manage your listed, unlisted, and lent out books</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by book title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {filterOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={selectedFilter === option.value ? "default" : "outline"}
                  onClick={() => setSelectedFilter(option.value as FilterStatus)}
                  className={`flex items-center gap-2 ${selectedFilter === option.value
                      ? "bg-black text-white hover:bg-gray-800 border-black"
                      : ""
                    }`}

                >
                  <Filter className="w-4 h-4" />
                  {option.label}
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                    {option.count}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {/* Lending List */}
          <div className="space-y-4">
            {filteredBooks.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No books found</h3>
                  <p className="text-gray-500">Try adjusting filters or search terms</p>
                </div>
              </Card>
            ) : (
              filteredBooks.map((book: LendingItem) => (
                <Card key={book.id}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{book.title}</h3>
                      <p className="text-sm text-gray-600">
                        Status:{" "}
                        {book.status === "Listed" && (
                          <span className="text-green-600 font-medium">Listed</span>
                        )}
                        {book.status === "Unlisted" && (
                          <span className="text-gray-500 font-medium">Unlisted</span>
                        )}
                        {book.status === "LendOut" && (
                          <span className="text-blue-600 font-medium">Lend Out</span>
                        )}
                        {" | "}Listed On {book.listedDate}
                      </p>
                      {book.dueDate && (
                        <p
                          className={`text-sm ${book.overdue ? "text-red-600 font-semibold" : "text-gray-700"
                            }`}
                        >
                          Due Date {book.dueDate}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    {book.status === "Listed" && (
                      <Button variant="outline" size="sm">
                        Unlist
                      </Button>
                    )}
                    {book.status === "Unlisted" && (
                      <Button variant="outline" size="sm">
                        List
                      </Button>
                    )}
                    {book.status === "LendOut" && (
                      <>
                        <Button variant="outline" size="sm">
                          Detail
                        </Button>
                        <Button size="sm">
                          Message Borrower
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
