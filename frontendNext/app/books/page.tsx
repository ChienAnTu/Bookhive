// app/books/page.tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Book, 
  Filter, 
  Search, 
  Grid3X3, 
  List,
  SortAsc,
  SortDesc,
  MapPin,
  Clock
} from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import BookCard from "../components/common/BookCard";
import { 
  mockBooks, 
  getUserById, 
  getCurrentUser,
  calculateDistance 
} from "@/app/data/mockData";

type SortOption = "newest" | "oldest" | "distance" | "title" | "author";
type ViewMode = "grid" | "list";
type FilterCategory = "all" | string;
type FilterLanguage = "all" | string;
type FilterDelivery = "all" | "post" | "self-help" | "both";
type FilterStatus = "all" | "available" | "borrowed";

export default function BooksPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>("all");
  const [selectedLanguage, setSelectedLanguage] = useState<FilterLanguage>("all");
  const [selectedDelivery, setSelectedDelivery] = useState<FilterDelivery>("all");
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>("all");
  
  const currentUser = getCurrentUser();

  // Get available books (excluding user's own books)
  const availableBooks = useMemo(() => {
    return mockBooks.filter(book => book.ownerId !== currentUser.id);
  }, [currentUser.id]);

  // Get unique categories and languages for filters
  const categories = useMemo(() => {
    const cats = [...new Set(availableBooks.map(book => book.category))];
    return cats.sort();
  }, [availableBooks]);

  const languages = useMemo(() => {
    const langs = [...new Set(availableBooks.map(book => book.language))];
    return langs.sort();
  }, [availableBooks]);

  // Filter and sort books
  const filteredBooks = useMemo(() => {
    let filtered = availableBooks;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(book => 
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(book => book.category === selectedCategory);
    }

    // Language filter
    if (selectedLanguage !== "all") {
      filtered = filtered.filter(book => book.language === selectedLanguage);
    }

    // Delivery method filter
    if (selectedDelivery !== "all") {
      filtered = filtered.filter(book => 
        book.deliveryMethod === selectedDelivery || book.deliveryMethod === "both"
      );
    }

    // Status filter
    if (selectedStatus !== "all") {
      filtered = filtered.filter(book => book.status === selectedStatus);
    }

    // Sort books
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
        case "oldest":
          return new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
        case "distance":
          const ownerA = getUserById(a.ownerId);
          const ownerB = getUserById(b.ownerId);
          const distanceA = ownerA?.coordinates ? calculateDistance(
            currentUser.coordinates.lat, currentUser.coordinates.lng,
            ownerA.coordinates.lat, ownerA.coordinates.lng
          ) : 999;
          const distanceB = ownerB?.coordinates ? calculateDistance(
            currentUser.coordinates.lat, currentUser.coordinates.lng,
            ownerB.coordinates.lat, ownerB.coordinates.lng
          ) : 999;
          return distanceA - distanceB;
        case "title":
          return a.title.localeCompare(b.title);
        case "author":
          return a.author.localeCompare(b.author);
        default:
          return 0;
      }
    });

    return filtered;
  }, [availableBooks, searchTerm, selectedCategory, selectedLanguage, selectedDelivery, selectedStatus, sortBy, currentUser]);

  const handleViewBookDetails = (bookId: string) => {
    router.push(`/books/${bookId}`);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedLanguage("all");
    setSelectedDelivery("all");
    setSelectedStatus("all");
  };

  const activeFiltersCount = [
    selectedCategory !== "all",
    selectedLanguage !== "all", 
    selectedDelivery !== "all",
    selectedStatus !== "all",
    searchTerm.length > 0
  ].filter(Boolean).length;

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "distance", label: "Nearest First" },
    { value: "title", label: "Title A-Z" },
    { value: "author", label: "Author A-Z" }
  ];

  const deliveryOptions = [
    { value: "all", label: "All Methods" },
    { value: "post", label: "Post Only" },
    { value: "self-help", label: "Pickup Only" },
    { value: "both", label: "Post & Pickup" }
  ];

  const statusOptions = [
    { value: "all", label: "All Books" },
    { value: "available", label: "Available" },
    { value: "borrowed", label: "Currently Borrowed" }
  ];

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Books</h1>
            <p className="text-gray-600">
              Discover and borrow books from your community
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search books by title, author, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* View Mode Toggle */}
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="p-2"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="p-2"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              {/* Language Filter */}
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Languages</option>
                {languages.map(language => (
                  <option key={language} value={language}>{language}</option>
                ))}
              </select>

              {/* Delivery Filter */}
              <select
                value={selectedDelivery}
                onChange={(e) => setSelectedDelivery(e.target.value as FilterDelivery)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {deliveryOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as FilterStatus)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>

              {/* Sort Options */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>

              {/* Clear Filters */}
              {activeFiltersCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Clear Filters ({activeFiltersCount})
                </Button>
              )}
            </div>
          </div>

          {/* Results Header */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-gray-600">
              {filteredBooks.length} book{filteredBooks.length !== 1 ? 's' : ''} found
            </p>
          </div>

          {/* Books Grid/List */}
          {filteredBooks.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <Book className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No books found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || activeFiltersCount > 0 
                    ? "Try adjusting your search terms or filters" 
                    : "There are no books available at the moment"}
                </p>
                {activeFiltersCount > 0 && (
                  <Button
                    onClick={handleClearFilters}
                    className="flex items-center gap-2 mx-auto"
                  >
                    <Filter className="w-4 h-4" />
                    Clear All Filters
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <div className={
              viewMode === "grid" 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
            }>
              {filteredBooks.map((book) => {
                const owner = getUserById(book.ownerId);
                
                if (viewMode === "grid") {
                  return (
                    <BookCard
                      key={book.id}
                      book={book}
                      owner={owner}
                      onViewDetails={handleViewBookDetails}
                    />
                  );
                } else {
                  // List view - simplified card layout
                  return (
                    <Card 
                      key={book.id} 
                      hover={true}
                      onClick={() => handleViewBookDetails(book.id)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-20 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                          {book.imageUrl ? (
                            <img
                              src={book.imageUrl}
                              alt={book.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                              <span className="text-2xl">📚</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {book.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">by {book.author}</p>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              <span>{owner?.location}</span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              <span>{book.maxLendingDays} days max</span>
                            </div>
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                              {book.category}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end space-y-1">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            book.status === "available" 
                              ? "bg-green-100 text-green-700" 
                              : "bg-yellow-100 text-yellow-700"
                          }`}>
                            {book.status === "available" ? "Available" : "Borrowed"}
                          </span>
                          <div className="text-sm text-gray-600">
                            ${book.fees.deposit} deposit
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                }
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}