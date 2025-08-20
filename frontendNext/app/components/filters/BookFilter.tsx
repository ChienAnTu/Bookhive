// app/components/filters/BookFilter.tsx
import React, { useState } from "react";
import { X, BookOpen, Globe, Package, Tag, Filter } from "lucide-react";
import { Book } from "@/app/data/mockData";

export interface BookFilters {
  category: string;
  language: string;
  deliveryMethod: string;
}

export interface BookFilterProps {
  filters: BookFilters;
  books: Book[];
  onFilterChange: (key: keyof BookFilters, value: string) => void;
  onClearFilters: () => void;
  className?: string;
}

const BookFilter: React.FC<BookFilterProps> = ({
  filters,
  books,
  onFilterChange,
  onClearFilters,
  className = "",
}) => {
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Extract unique categories and languages from books data
  const allCategories = [...new Set(books.map((book) => book.category))];
  const allLanguages = [...new Set(books.map((book) => book.language))];
  const allGenres = [...new Set(books.flatMap((book) => book.genre))];

  // Count frequency of each category, language, and genre
  const categoryCount = allCategories.map((category) => ({
    name: category,
    count: books.filter((book) => book.category === category).length,
  }));

  const languageCount = allLanguages.map((language) => ({
    name: language,
    count: books.filter((book) => book.language === language).length,
  }));

  const genreCount = allGenres.map((genre) => ({
    name: genre,
    count: books.filter((book) => book.genre.includes(genre)).length,
  }));

  // Sort by frequency (most common first) and take top 5
  const topCategories = categoryCount
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((item) => item.name);

  const topLanguages = languageCount
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((item) => item.name);

  const topGenres = genreCount
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((item) => item.name);

  // Delivery method options with clear labels
  const deliveryOptions = [
    { value: "", label: "All Methods" },
    { value: "post", label: "Post" },
    { value: "self-help", label: "Pickup" },
  ];

  // Calculate the number of active filters for UI feedback
  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Categories Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900 flex items-center">
            <BookOpen className="w-4 h-4 mr-2" />
            Categories
          </h4>
          {activeFiltersCount > 0 && (
            <button
              onClick={() => {
                onClearFilters();
                setIsMobileFilterOpen(false);
              }}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
              aria-label="Clear all filters"
            >
              <X className="w-3 h-3 mr-1" />
              Clear
            </button>
          )}
        </div>
        <div className="space-y-2">
          <button
            onClick={() => {
              onFilterChange("category", "");
              setIsMobileFilterOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-md text-sm ${
              filters.category === ""
                ? "bg-black text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            All Categories
          </button>
          {topCategories.map((category) => (
            <button
              key={category}
              onClick={() => {
                onFilterChange("category", category);
                setIsMobileFilterOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                filters.category === category
                  ? "bg-black text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Languages Section */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
          <Globe className="w-4 h-4 mr-2" />
          Languages
        </h4>
        <div className="space-y-2">
          <button
            onClick={() => {
              onFilterChange("language", "");
              setIsMobileFilterOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-md text-sm ${
              filters.language === ""
                ? "bg-black text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            All Languages
          </button>
          {topLanguages.map((language) => (
            <button
              key={language}
              onClick={() => {
                onFilterChange("language", language);
                setIsMobileFilterOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                filters.language === language
                  ? "bg-black text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {language}
            </button>
          ))}
        </div>
      </div>

      {/* Delivery Method Section */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
          <Package className="w-4 h-4 mr-2" />
          Delivery Method
        </h4>
        <div className="space-y-2">
          {deliveryOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onFilterChange("deliveryMethod", option.value);
                setIsMobileFilterOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                filters.deliveryMethod === option.value
                  ? "bg-black text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Genres Section */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
          <Tag className="w-4 h-4 mr-2" />
          Genres ({topGenres.length})
        </h4>
        <div className="flex flex-wrap gap-2">
          {topGenres.map((genre) => (
            <button
              key={genre}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
            >
              {genre}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Filter - 桌面端固定侧边栏（调整为更窄的宽度） */}
      <div className="hidden lg:block w-48 fixed top-16 bottom-0 left-0 overflow-y-auto z-30">
        <div className={`bg-transparent p-4 border-0 ${className}`}>
          <FilterContent />
        </div>
      </div>

      {/* Mobile Filter Button - 移动端浮动按钮 */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMobileFilterOpen(true)}
          className="bg-black text-white p-3 rounded-full shadow-lg flex items-center space-x-2"
        >
          <Filter className="w-5 h-5" />
          {activeFiltersCount > 0 && (
            <span className="bg-white text-black text-xs px-2 py-1 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Mobile Filter Modal - 移动端底部弹出框 */}
      {isMobileFilterOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-xl max-h-[80vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between rounded-t-xl">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="ml-2 bg-black text-white text-xs px-2 py-1 rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </h3>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4">
              <FilterContent />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BookFilter;
