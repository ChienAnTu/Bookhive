// app/shipping/page.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Package,
  Truck,
  Clock,
  CheckCircle,
  AlertCircle,
  MapPin,
  Calendar,
  Filter,
  Search
} from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { getCurrentUser, getUserById } from "@/utils/auth";
import { getBorrowingOrders, getLendingOrders, type Order } from "@/utils/orders";
import { getBookById } from "@/utils/books";
import type { Book } from "@/app/types/book";
import type { User } from "@/app/types/user";

// Shipping specific status mapping - only show shipping-relevant statuses
type ShippingStatus = "PENDING_SHIPMENT" | "BORROWING" | "RETURNED" | "COMPLETED";
type FilterStatus = "all" | ShippingStatus;

export default function ShippingPage() {
  const [selectedFilter, setSelectedFilter] = useState<FilterStatus>("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Data states
  const [orders, setOrders] = useState<Order[]>([]);
  const [books, setBooks] = useState<Record<string, Book>>({});
  const [users, setUsers] = useState<Record<string, User>>({});
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current user
        const user = await getCurrentUser();
        setCurrentUser(user);

        if (user) {
          // Get both borrowing and lending orders
          const [borrowingOrders, lendingOrders] = await Promise.all([
            getBorrowingOrders(),
            getLendingOrders()
          ]);
          
          const allOrders = [...borrowingOrders, ...lendingOrders];
          setOrders(allOrders);

          // Load book details for all orders
          const bookMap: Record<string, Book> = {};
          const userMap: Record<string, User> = {};
          
          for (const order of allOrders) {
            // Load books
            for (const bookId of order.bookIds) {
              try {
                const book = await getBookById(bookId);
                if (book) {
                  bookMap[bookId] = book;
                }
              } catch (error) {
                console.error(`Failed to load book ${bookId}:`, error);
              }
            }
            
            // Load users
            try {
              const borrower = await getUserById(order.borrowerId);
              const owner = await getUserById(order.ownerId);
              if (borrower) userMap[order.borrowerId] = borrower;
              if (owner) userMap[order.ownerId] = owner;
            } catch (error) {
              console.error(`Failed to load users for order ${order.id}:`, error);
            }
          }
          
          setBooks(bookMap);
          setUsers(userMap);
        }
      } catch (err) {
        console.error("Failed to load shipping data:", err);
        setError("Failed to load shipping information. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Get user's shipping orders (both as borrower and owner)
  const userOrders = useMemo(() => {
    if (!currentUser) return [];
    return orders.filter(order =>
      order.borrowerId === currentUser.id || order.ownerId === currentUser.id
    );
  }, [orders, currentUser]);

  const filteredOrders = useMemo(() => {
    let filtered = userOrders;

    if (selectedFilter !== "all") {
      filtered = filtered.filter(order => order.status === selectedFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(order => {
        // Search in book titles from loaded books
        const orderBooks = order.bookIds.map(id => books[id]).filter(Boolean);
        return orderBooks.some(book => 
          book.titleOr?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          book.author?.toLowerCase().includes(searchTerm.toLowerCase())
        ) || order.id.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [userOrders, selectedFilter, searchTerm, books]);

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "PENDING_SHIPMENT": return <Clock className="w-5 h-5 text-orange-500" />;
      case "BORROWING": return <Truck className="w-5 h-5 text-blue-500" />;
      case "RETURNED": return <Package className="w-5 h-5 text-green-500" />;
      case "COMPLETED": return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "CANCELED": return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "PENDING_SHIPMENT": return "text-orange-700 bg-orange-50 border-orange-200";
      case "BORROWING": return "text-blue-700 bg-blue-50 border-blue-200";
      case "RETURNED": return "text-green-700 bg-green-50 border-green-200";
      case "COMPLETED": return "text-green-700 bg-green-50 border-green-200";
      case "CANCELED": return "text-red-700 bg-red-50 border-red-200";
      default: return "text-gray-700 bg-gray-50 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const getOrderRole = (order: Order) => {
    if (!currentUser) return "Unknown";
    return order.borrowerId === currentUser.id ? "Borrowing" : "Lending";
  };

  const getOtherUser = (order: Order): User | null => {
    if (!currentUser) return null;
    const otherUserId = order.borrowerId === currentUser.id ? order.ownerId : order.borrowerId;
    return users[otherUserId] || null;
  };

  const filterOptions = [
    { value: "all", label: "All Orders", count: userOrders.length },
    { value: "PENDING_SHIPMENT", label: "Pending Shipment", count: userOrders.filter(o => o.status === "PENDING_SHIPMENT").length },
    { value: "BORROWING", label: "In Transit", count: userOrders.filter(o => o.status === "BORROWING").length },
    { value: "RETURNED", label: "Returned", count: userOrders.filter(o => o.status === "RETURNED").length },
    { value: "COMPLETED", label: "Completed", count: userOrders.filter(o => o.status === "COMPLETED").length }
  ];

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Shipping & Orders</h1>
            <p className="text-gray-600">Track your book borrowing and lending orders</p>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by book title or author..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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

          {/* Orders List */}
          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                  <p className="text-gray-500">
                    {searchTerm ? "Try adjusting your search terms" : "You don't have any shipping orders yet"}
                  </p>
                </div>
              </Card>
            ) : (
              filteredOrders.map((order) => {
                // Get book data for the first book ID in the order
                const firstBookId = order.bookIds[0];
                const book = books[firstBookId];
                const otherUser = getOtherUser(order);
                const role = getOrderRole(order);

                if (!book || !otherUser) return null;

                return (
                  <Card key={order.id}>
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-20 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                        {book.coverImgUrl ? (
                          <img
                            src={book.coverImgUrl}
                            alt={book.titleOr}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <span className="text-2xl"></span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {book.titleOr}
                            </h3>
                            <p className="text-sm text-gray-600">by {book.author}</p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>Ordered: {formatDate(order.createdAt)}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mr-2" />
                            <span>{role === "Borrowing" ? "From" : "To"}: {otherUser.city}, {otherUser.state}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            {getStatusIcon(order.status)}
                            <span className="ml-2">
                              {role === "Borrowing" ? "Borrowing from" : "Lending to"} {otherUser.name}
                            </span>
                          </div>
                        </div>

                        {order.shippingInfo && (
                          <div className="bg-gray-50 rounded-lg p-3 mb-4">
                            <h4 className="font-medium text-gray-900 mb-2">Shipping Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Tracking Number:</span> {order.shippingInfo.trackingNumber}
                              </div>
                              <div>
                                <span className="font-medium">Carrier:</span> {order.shippingInfo.carrier}
                              </div>
                              <div>
                                <span className="font-medium">Tracking Number:</span> {order.shippingInfo?.trackingNumber || "Not available"}
                              </div>
                              <div>
                                <span className="font-medium">Shipping Address:</span> {order.shippingInfo.address}
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            Order ID: {order.id}
                          </div>
                          <div className="flex space-x-2">
                            {order.shippingInfo?.trackingNumber && (
                              <Button variant="outline" size="sm">
                                Track Package
                              </Button>
                            )}
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}