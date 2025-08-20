import React from "react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import { MapPin, Star, Clock, Calendar } from "lucide-react";

export interface BookCardProps {
  book: {
    id: string;
    title: string;
    author: string;
    imageUrl?: string;
    condition: string;
    deposit: number;
    serviceFee: number;
    location: string;
    distance: string;
    rating: number;
    maxDays: number;
    dateAdded: string;
    tags: string[];
    deliveryMethod: string;
  };
  onViewDetails?: (bookId: string) => void;
}

const BookCard: React.FC<BookCardProps> = ({ book, onViewDetails }) => {
  const getDeliveryLabel = (method: string) => {
    switch (method) {
      case "both":
        return "Pickup and Post";
      case "delivery":
        return "Post";
      case "pickup":
        return "Pickup";
      default:
        return "Pickup and Post";
    }
  };

  return (
    <Card hover className="max-w-sm overflow-hidden p-0 h-full flex flex-col">
      <div className="relative">
        {/* delivery method */}
        <div className="absolute top-3 left-3 z-10">
          <span className="bg-white bg-opacity-95 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium text-gray-700 shadow-sm">
            {getDeliveryLabel(book.deliveryMethod)}
          </span>
        </div>

        {/* cover picture */}
        <div className="aspect-[4/5] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          {book.imageUrl ? (
            <img
              src={book.imageUrl}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center">
              <div className="text-6xl mb-2">📚</div>
              <div className="text-sm text-gray-500 font-medium">
                {book.title.slice(0, 20)}...
              </div>
            </div>
          )}
        </div>
      </div>

      {/* book info area */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex-1">
          {/* title and author */}
          <div className="mb-3">
            <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 mb-1">
              {book.title}
            </h3>
            <p className="text-gray-600 text-sm">by {book.author}</p>
          </div>

          {/* tags */}
          <div className="flex flex-wrap gap-1 mb-4">
            {book.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full border"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* fixed */}
        <div className="space-y-3">
          {/* distance */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{book.location}</span>
            </div>
            <span className="font-medium">{book.distance}</span>
          </div>

          {/* rating and maxdays */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center">
              <Star className="w-4 h-4 mr-1 text-yellow-400 fill-current" />
              <span className="font-medium">{book.rating}</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              <span>{book.maxDays} days max</span>
            </div>
          </div>

          {/* added date */}
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="w-4 h-4 mr-1" />
            <span>Added {book.dateAdded}</span>
          </div>

          {/* detail button */}
          <Button
            variant="primary"
            fullWidth
            className="bg-black text-white hover:bg-gray-800"
            onClick={() => onViewDetails?.(book.id)}
          >
            View Details
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default BookCard;
