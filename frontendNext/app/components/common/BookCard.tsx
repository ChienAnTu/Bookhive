import React from "react";
import Card from "../ui/Card";
import { MapPin, Star, Clock, Calendar } from "lucide-react";
// import Link from "next/link";
import {
  Book,
  User,
  calculateDistance,
  getCurrentUser,
} from "@/app/data/mockData";

export interface BookCardProps {
  book: Book;
  owner?: User;
  onViewDetails?: (bookId: string) => void;
}

const BookCard: React.FC<BookCardProps> = ({ book, owner, onViewDetails }) => {
  const currentUser = getCurrentUser();

  const distance =
    owner && owner.coordinates
      ? calculateDistance(
          currentUser.coordinates.lat,
          currentUser.coordinates.lng,
          owner.coordinates.lat,
          owner.coordinates.lng
        )
      : 0;

  const getDeliveryLabel = (method: string) => {
    switch (method) {
      case "both":
        return "Pickup and Post";
      case "post":
        return "Post";
      case "self-help":
        return "Pickup";
      default:
        return "Pickup and Post";
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "new":
      case "like-new":
        return "text-green-600 bg-green-50";
      case "good":
        return "text-blue-600 bg-blue-50";
      case "fair":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const formatDateAdded = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "today";
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <Card
      hover={true}
      padding={false}
      className="w-full overflow-hidden h-full flex flex-col transform-none"
      onClick={() => onViewDetails?.(book.id)}
    >
      {/* 封面图片区域 */}
      <div className="relative w-full">
        {/* delivery method */}
        <div className="absolute top-3 left-3 z-10">
          <span className="bg-white bg-opacity-95 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium text-gray-700 shadow-sm">
            {getDeliveryLabel(book.deliveryMethod)}
          </span>
        </div>

        <div className="aspect-[4/5] w-full">
          {book.imageUrl ? (
            <img
              src={book.imageUrl}
              alt={book.title}
              className="w-full h-full object-cover block"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-2">📚</div>
                <div className="text-sm text-gray-500 font-medium">
                  {book.title.slice(0, 20)}...
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 信息区域 */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex-1">
          {/* title and author */}
          <div className="mb-3">
            <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 mb-1 leading-tight">
              {book.title}
            </h3>
            <p className="text-gray-600 text-sm">by {book.author}</p>
          </div>

          {/* tags */}
          <div className="flex flex-wrap gap-1 mb-4">
            {book.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* fixed info */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center min-w-0 flex-1">
              <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="truncate">
                {owner?.location || "Unknown location"}
              </span>
            </div>
            <span className="font-medium ml-2 flex-shrink-0">
              {distance}km away
            </span>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center">
              <Star className="w-4 h-4 mr-1 text-yellow-400 fill-current flex-shrink-0" />
              <span className="font-medium">{owner?.rating || "N/A"}</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1 flex-shrink-0" />
              <span>{book.maxLendingDays} days max</span>
            </div>
          </div>

          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="w-4 h-4 mr-1 flex-shrink-0" />
            <span>Added {formatDateAdded(book.dateAdded)}</span>
          </div>

          <div className="flex items-center justify-between text-sm pt-1 border-t border-gray-100">
            <span className="text-gray-600">Deposit: ${book.fees.deposit}</span>
            <span className="text-gray-600">Fee: ${book.fees.serviceFee}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default BookCard;
