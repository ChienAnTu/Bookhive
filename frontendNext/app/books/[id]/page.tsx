// app/books/[id]/page.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Star,
  MapPin,
  Clock,
  ArrowLeft,
  Share2,
  MessageCircle,
  Package,
  Shield,
  ShoppingBag,
  Book as BookIcon,
  Languages,
} from "lucide-react";
import Card from "@/app/components/ui/Card";
import Button from "@/app/components/ui/Button";
import Modal from "@/app/components/ui/Modal";
import {
  calculateDistance
} from "@/app/data/mockData";

import { getBookById } from "@/utils/books";
import type { Book } from "@/app/types/book";
import type { User } from "@/app/types/user";
import { getUserById } from "@/utils/auth";
import { addItemToCart } from "@/utils/cart";

import Avatar from "@/app/components/ui/Avatar";
import { useCartStore } from "@/app/store/cartStore";
import { toast } from 'sonner';

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.id as string;

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [owner, setOwner] = useState<User | null>(null);

  const addToCart = useCartStore((state) => state.addToCart);


  const distance = useMemo(() => {
    if (!owner?.coordinates || !currentUser?.coordinates) return 0;
    return calculateDistance(
      currentUser.coordinates.lat,
      currentUser.coordinates.lng,
      owner.coordinates.lat,
      owner.coordinates.lng
    );
  }, [owner, currentUser]);

  useEffect(() => {
    if (!bookId) return;
    setLoading(true);
    getBookById(bookId)
      .then((data) => {
        if (!data) return;
        setBook(data);
        if (data.ownerId) {
          getUserById(data.ownerId).then((user) => {
            console.log("Fetched owner:", user);

            if (user) setOwner(user);
          });
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load book details.");
      })
      .finally(() => setLoading(false));
  }, [bookId]);


  if (loading) {
    return <div className="flex h-full items-center justify-center">Loading...</div>;
  }

  if (error || !book) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {error || "Book not found"}
          </h3>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

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
        return "text-green-600 bg-green-50 border-green-200";
      case "good":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "fair":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const formatKm = (km: number) =>
    km >= 100 ? `${Math.round(km)} km` : `${km.toFixed(1)} km`;

  const handleSendRequest = () => {
    console.log("Sending request with message:", requestMessage);
    setIsRequestModalOpen(false);
    setRequestMessage("");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: book.titleOr,
        text: `Check out "${book.titleOr}" by ${book.author} on BookHive`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  console.log("bookId from params:", bookId);


  if (typeof window === "undefined") {
    return <div className="p-6">Loading...</div>;
  }

  return (

    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              {/* cover img */}
              <Card padding={false} className="overflow-hidden">
                <div className="aspect-[3/4] w-full">
                  {book.coverImgUrl ? (
                    <img
                      src={book.coverImgUrl}
                      alt={book.titleOr}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-6xl mb-4"></div>
                        <div className="text-sm text-gray-500 font-medium px-4">
                          {book.titleOr}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Request This Book */}
                <div className="p-4 space-y-3">
                  <Button
                    onClick={async () => {
                      try {
                        await addItemToCart({
                          bookId: book.id,
                          ownerId: book.ownerId,
                          actionType: book.canRent ? "borrow" : "purchase",
                          price: book.salePrice,
                          deposit: book.deposit,
                        });
                        toast?.success?.("Added to cart");
                      } catch (err) {
                        console.error("Failed to add item:", err);
                        toast?.error?.("Failed to add item");
                      }
                    }}
                    className="w-full flex items-center justify-center space-x-2"
                    disabled={book.status !== "listed" || (!book.canRent && !book.canSell)}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>
                      {book.status !== "listed"
                        ? "Unlisted"
                        : book.canRent
                          ? "Request This Book"
                          : book.canSell
                            ? "Purchase Only"
                            : "Unavailable"}
                    </span>
                  </Button>



                  {/* Share books */}
                  <Button
                    variant="outline"
                    onClick={handleShare}
                    className="w-full flex items-center justify-center space-x-2"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </Button>
                </div>
              </Card>
            </div>

            {/* book info */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {book.titleOr}
                    </h1>
                    <p className="text-xl text-gray-600 mb-4">by {book.author}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getConditionColor(book.condition)}`}>
                    {book.condition}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {book.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {book.description}
                  </p>
                </div>

                <h4 className="font-semibold text-gray-900 mb-3">Book Information</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500 flex items-center gap-1">
                          <BookIcon className="w-4 h-4" />
                          Category:</span>
                        <span className="font-medium">{book.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 flex items-center gap-1">
                          <Languages className="w-4 h-4" />
                          Language:</span>
                        <span className="font-medium">{book.originalLanguage}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 flex items-center gap-1">
                          <ShoppingBag className="w-4 h-4" />
                          Trading Way:</span>
                        <span className="font-medium">
                          {book.canRent ? "Borrow" : ""}
                          {book.canSell ? (book.canRent ? " / Buy" : "Buy") : ""}
                          {(!book.canRent && !book.canSell) && "Unavailable"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Max lending:
                        </span>
                        <span className="font-medium">{book.maxLendingDays} days</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          Delivery:
                        </span>
                        <span className="font-medium">{getDeliveryLabel(book.deliveryMethod)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 flex items-center gap-1">
                          <Shield className="w-4 h-4" />
                          Deposit:
                        </span>
                        <span className="font-medium">${book.deposit}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* owner info */}
              {/* {owner && (
                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Book Owner</h3>
                  <div className="flex items-center space-x-4">
                    <Avatar user={owner} size={64} />

                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{owner.name}</h4>
                      <div className="flex items-center text-gray-600 text-sm mt-1">
                        <MapPin className="w-4 h-4 mr-1" />
                        <p>
                          {[
                            owner.city,
                            owner.state,
                            owner.zipCode,
                          ].filter(Boolean).join(", ")}
                        </p>
                        <div>
                          {distance > 0 ? ` • ${formatKm(distance)} away from you` : ""}
                        </div>

                      </div>
                      <div className="flex items-center mt-2">
                        <div className="flex items-center mr-3">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${star <= Math.floor(owner.rating)
                                ? "text-yellow-400 fill-current"
                                : "text-gray-300"
                                }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          {owner.rating}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => setIsRequestModalOpen(true)}
                    >
                      <MessageCircle className="w-4 h-4" />
                      Message
                    </Button>

                  </div>
                </Card>
              )} */}
            </div>
          </div>
        </div>
      </div>

      {/* message owner */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="Send Message to Owner"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Send a message to owner to request borrowing "{book.titleOr}".
            </p>
            <textarea
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              placeholder="Hi! I am interested in borrowing this book. When would be a good time to arrange pickup/delivery?"
              className="w-full p-3 border border-gray-300 rounded-lg resize-none h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsRequestModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendRequest}
              disabled={!requestMessage.trim()}
            >
              Send
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}