// app/books/[id]/page.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { Star, MapPin, Clock, Share2, MessageCircle, Package, Shield, ShoppingBag, Book as BookIcon, Languages } from "lucide-react";
import Card from "@/app/components/ui/Card";
import Button from "@/app/components/ui/Button";
import Modal from "@/app/components/ui/Modal";
import { calculateDistance } from "@/app/data/mockData";
import { sendMessage } from "@/utils/messageApi";

import { getBookById } from "@/utils/books";
import type { Book } from "@/app/types/book";
import type { User } from "@/app/types/user";
import { getUserById, getCurrentUser } from "@/utils/auth";
import { isProfileComplete } from "@/utils/profileValidation";
import ProfileIncompleteModal from "@/app/components/ui/ProfileIncompleteModal";

import Avatar from "@/app/components/ui/Avatar";
import { useCartStore } from "@/app/store/cartStore";
import StarRating from "@/app/components/ui/StarRating";

import { toast } from 'sonner';


export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.id as string;

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [owner, setOwner] = useState<User | null>(null);

  const { cart, fetchCart, addToCart } = useCartStore();
  const alreadyInCart = cart.some((item) => item.id === book?.id);

  const distance = useMemo(() => {
    if (!owner?.coordinates || !currentUser?.coordinates) return 0;
    return calculateDistance(
      currentUser.coordinates.lat,
      currentUser.coordinates.lng,
      owner.coordinates.lat,
      owner.coordinates.lng
    );
  }, [owner, currentUser]);

  // pull cart first
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);
  console.log("cart info:", cart)

  // pull book and owner
  useEffect(() => {
    if (!bookId) return;
    setLoading(true);

    (async () => {
      try {
        const b = await getBookById(bookId);
        if (!b) return;
        setBook(b);

        // parallel
        if (b.ownerId) {
          const [u] = await Promise.all([getUserById(b.ownerId)]);
          setOwner(u);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load book details.");
      } finally {
        setLoading(false);
      }
    })();
  }, [bookId]);

  // 拉取当前用户
  useEffect(() => {
    (async () => {
      const u = await getCurrentUser();
      setCurrentUser(u);
    })();
  }, []);

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

  const handleSendRequest = async () => {
    if (!owner || !currentUser || !requestMessage.trim()) {
      toast.error("Please fill in the message");
      return;
    }
    try {
      // Add book info to message
      const messageWithBookInfo = `Book Request: ${book.titleOr}\n\n${requestMessage}`;
      console.log("Attempting to send message to owner email:", owner.email);
      await sendMessage(owner.email, messageWithBookInfo);
      toast.success("Message sent successfully");
      setIsRequestModalOpen(false);
      setRequestMessage("");

      // Redirect to the messages page and specify which conversation to open.
      // The timeout is kept to allow the user to see the success message.
      setTimeout(() => {
        router.push(`/message?to=${owner.email}`);
      }, 1500);

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.message || "Failed to send message");
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: book.titleOr,
        text: `Check out "${book.titleOr}" by ${book.author} on BookBorrow`,
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
                      if (!book) return;

                      // check current user profile if is complete
                      if (!currentUser || !isProfileComplete(currentUser)) {
                        setIsProfileModalOpen(true);
                        return;
                      }

                      // Already in cart
                      if (alreadyInCart) {
                        toast.error("This book is already in your cart");
                        return;
                      }

                      try {
                        const result = await addToCart(book, book.canRent ? "borrow" : "purchase");
                        if (result) {
                          toast.success("Added to cart");
                        } else {
                          toast.error("Failed to add item");
                        }
                      } catch (err) {
                        console.error("Failed to add item:", err);
                        toast.error("Failed to add item");
                      }
                    }}
                    className="w-full flex items-center justify-center space-x-2"
                    disabled={
                      alreadyInCart || book.status !== "listed" || (!book.canRent && !book.canSell)
                    }
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>
                      {alreadyInCart
                        ? "Already in Cart"
                        : book.status !== "listed"
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
                  {/* Description */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700 leading-relaxed mb-3">
                    {book.description}
                  </p>

                  {/* Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 flex items-center gap-1">
                        <BookIcon className="w-4 h-4" />
                        Category:
                      </span>
                      <span className="font-medium">{book.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 flex items-center gap-1">
                        <Languages className="w-4 h-4" />
                        Language:
                      </span>
                      <span className="font-medium">{book.originalLanguage}</span>
                    </div>
                  </div>
                </div>

                {/* Trading Info */}
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  Trading Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-1 mb-6 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 flex items-center gap-1">
                      <ShoppingBag className="w-4 h-4" />
                      Trading Way:
                    </span>
                    <span className="font-medium">
                      {book.canRent ? "Borrow" : ""}
                      {book.canSell ? (book.canRent ? " / Purchase" : "Purchase") : ""}
                      {!book.canRent && !book.canSell && "Unavailable"}
                    </span>
                  </div>

                  {book.canRent && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Max lending:
                      </span>
                      <span className="font-medium">{book.maxLendingDays} days</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      Delivery Method:
                    </span>
                    <span className="font-medium">{getDeliveryLabel(book.deliveryMethod)}</span>
                  </div>
                </div>

                {/* Price Info (only show if applicable) */}
                {(book.canRent || book.canSell) && (
                  <>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Price</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-2 mb-6 text-sm">
                      {book.canRent && (
                        <div className="flex flex-col">
                          <div className="flex justify-between">
                            <span className="text-gray-500 flex items-center gap-1">
                              <Shield className="w-4 h-4" />
                              Deposit:
                            </span>
                            <span className="font-bold text-orange-600">
                              {book.deposit ? `$${book.deposit}` : "N/A"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            * Deposit is refundable upon timely return of the book in good condition.
                          </p>
                        </div>
                      )}

                      {book.canSell && (
                        <div className="flex flex-col">
                          <div className="flex justify-between">
                            <span className="text-gray-500 flex items-center gap-1">
                              <Shield className="w-4 h-4" />
                              Sale Price:
                            </span>
                            <span className="font-bold text-orange-600">
                              {book.salePrice ? `$${book.salePrice}` : "N/A"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            * Sale Price is the final purchase price (non-refundable).
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}


              </Card>

              {/* owner info */}
              {owner && (
                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Book Owner</h3>
                  <div className="flex items-center space-x-4">
                    <Avatar user={owner} size={64} />

                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        <Link
                          href={`/profile/${owner.id}`}
                          className="hover:underline hover:text-black transition"
                        >
                          {owner.firstName} {owner.lastName}
                        </Link>
                      </h4>
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
                        <StarRating rating={(owner as any).rating ?? 0} readonly size="sm" />
                        <span className="ml-2 text-sm text-gray-600">
                          {(owner as any).rating ?? 0}
                        </span>
                      </div>

                    </div>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => {
                        setIsRequestModalOpen(true);
                      }}
                    >
                      <MessageCircle className="w-4 h-4" />
                      Message
                    </Button>

                  </div>
                </Card>
              )}
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

      <ProfileIncompleteModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}