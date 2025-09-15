// app/shipping/page.tsx
"use client";

import { useState, useMemo } from "react";
import {
  Package,
  Truck,
  Clock,
  CheckCircle,
  AlertCircle,
  MapPin,
  Calendar,
  Filter,
  Search,
  ExternalLink,
  Send,
  Archive
} from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import {
  getCurrentUser,
  mockOrders,
  mockBooks,
  getUserById
} from "@/app/data/mockData";

type OrderStatus = "PENDING_PAYMENT" | "PENDING_SHIPMENT" | "BORROWING" | "OVERDUE" | "RETURNED" | "COMPLETED" | "CANCELED";
type FilterStatus = "all" | OrderStatus;

export default function ShippingPage() {
  const [selectedFilter, setSelectedFilter] = useState<FilterStatus>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"sent" | "received">("sent");

  const currentUser = getCurrentUser();

  // Get only AU Post orders (deliveryMethod === "post")
  const postOrders = useMemo(() => {
    return mockOrders.filter(order => order.deliveryMethod === "post");
  }, []);

  // Separate orders into sent out and received
  const sentOrders = useMemo(() => {
    return postOrders.filter(order => order.ownerId === currentUser.id);
  }, [postOrders, currentUser.id]);

  const receivedOrders = useMemo(() => {
    return postOrders.filter(order => order.borrowerId === currentUser.id);
  }, [postOrders, currentUser.id]);

  const currentOrders = activeTab === "sent" ? sentOrders : receivedOrders;

  const filteredOrders = useMemo(() => {
    let filtered = currentOrders;

    if (selectedFilter !== "all") {
      filtered = filtered.filter(order => order.status === selectedFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(order => {
        const bookTitles = order.bookIds.map(bookId => {
          const book = mockBooks.find(b => b.id === bookId);
          return book?.titleOr || "";
        }).join(" ");
        
        return bookTitles.toLowerCase().includes(searchTerm.toLowerCase()) ||
               order.id.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [currentOrders, selectedFilter, searchTerm]);

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case "PENDING_PAYMENT": return <Clock className="w-5 h-5 text-yellow-500" />;
      case "PENDING_SHIPMENT": return <Package className="w-5 h-5 text-blue-500" />;
      case "BORROWING": return <Truck className="w-5 h-5 text-orange-500" />;
      case "RETURNED": 
      case "COMPLETED": return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "OVERDUE": return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "CANCELED": return <AlertCircle className="w-5 h-5 text-gray-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "PENDING_PAYMENT": return "text-yellow-700 bg-yellow-50 border-yellow-200";
      case "PENDING_SHIPMENT": return "text-blue-700 bg-blue-50 border-blue-200";
      case "BORROWING": return "text-orange-700 bg-orange-50 border-orange-200";
      case "RETURNED": 
      case "COMPLETED": return "text-green-700 bg-green-50 border-green-200";
      case "OVERDUE": return "text-red-700 bg-red-50 border-red-200";
      case "CANCELED": return "text-gray-700 bg-gray-50 border-gray-200";
      default: return "text-gray-700 bg-gray-50 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-AU", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const getOtherUser = (order: any) => {
    const otherUserId = activeTab === "sent" ? order.borrowerId : order.ownerId;
    return getUserById(otherUserId);
  };

  const filterOptions = [
    { value: "all", label: "All Orders", count: currentOrders.length },
    { value: "PENDING_PAYMENT", label: "Pending Payment", count: currentOrders.filter(o => o.status === "PENDING_PAYMENT").length },
    { value: "PENDING_SHIPMENT", label: "Pending Shipment", count: currentOrders.filter(o => o.status === "PENDING_SHIPMENT").length },
    { value: "BORROWING", label: "In Transit/Borrowing", count: currentOrders.filter(o => o.status === "BORROWING").length },
    { value: "COMPLETED", label: "Completed", count: currentOrders.filter(o => o.status === "COMPLETED").length },
  ];

  const trackAustraliaPost = (trackingNumber: string) => {
    const trackingUrl = `https://auspost.com.au/mypost/track/#/details/${trackingNumber}`;
    window.open(trackingUrl, '_blank');
  };

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Shipping Orders</h1>
            <p className="text-gray-600">Track your AU Post shipping orders for book borrowing</p>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab("sent")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "sent"
                      ? "border-black text-black"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Orders Sent Out ({sentOrders.length})
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("received")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "received"
                      ? "border-black text-black"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Archive className="w-4 h-4" />
                    Orders Received ({receivedOrders.length})
                  </div>
                </button>
              </nav>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by book title or order ID..."
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
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No shipping orders found</h3>
                  <p className="text-gray-500">
                    {searchTerm ? "Try adjusting your search terms" : 
                     `You don't have any ${activeTab === "sent" ? "outgoing" : "incoming"} AU Post orders yet`}
                  </p>
                </div>
              </Card>
            ) : (
              filteredOrders.map((order) => {
                const books = order.bookIds.map(bookId => mockBooks.find(b => b.id === bookId)).filter(Boolean) as any[];
                const otherUser = getOtherUser(order);

                if (books.length === 0 || !otherUser) return null;

                return (
                  <Card key={order.id}>
                    <div className="space-y-4">
                      {/* Order Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="w-16 h-20 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                            {books[0].coverImgUrl ? (
                              <img
                                src={books[0].coverImgUrl}
                                alt={books[0].titleOr}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                <span className="text-2xl">📚</span>
                              </div>
                            )}
                          </div>

                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {books.map(book => book.titleOr).join(", ")}
                            </h3>
                            <p className="text-sm text-gray-600">
                              by {books.map(book => book.author).join(", ")}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {activeTab === "sent" ? "Sent to" : "Received from"}: {otherUser.firstName} {otherUser.lastName}
                            </p>
                          </div>
                        </div>

                        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(order.status)}
                            {order.status.replace(/_/g, " ")}
                          </div>
                        </div>
                      </div>

                      {/* Order Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>Ordered: {formatDate(order.createdAt)}</span>
                        </div>
                        <div className="flex items-center">
                          <Package className="w-4 h-4 mr-2" />
                          <span>Order ID: {order.id}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span>AU Post Delivery</span>
                        </div>
                      </div>

                      {/* Shipping Information */}
                      {order.shippingOut && (
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                            <Truck className="w-4 h-4" />
                            AU Post Tracking Information
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="font-medium text-blue-800">Tracking Number:</span>
                              <br />
                              <span className="text-blue-700 font-mono">{order.shippingOut.trackingNumber}</span>
                            </div>
                            <div>
                              <span className="font-medium text-blue-800">Carrier:</span>
                              <br />
                              <span className="text-blue-700">{order.shippingOut.carrier}</span>
                            </div>
                          </div>
                          <div className="mt-3">
                            <Button
                              size="sm"
                              onClick={() => order.shippingOut?.trackingNumber && trackAustraliaPost(order.shippingOut.trackingNumber)}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Track on Australia Post
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Pricing Information */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Order Summary</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Deposit:</span>
                            <span>${(order.deposit.amount / 100).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Service Fee:</span>
                            <span>${(order.serviceFee.amount / 100).toFixed(2)}</span>
                          </div>
                          {order.shippingOutFee && (
                            <div className="flex justify-between">
                              <span>Shipping Fee:</span>
                              <span>${(order.shippingOutFee.amount / 100).toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-medium border-t pt-1">
                            <span>Total Paid:</span>
                            <span>${(order.totalPaid.amount / 100).toFixed(2)}</span>
                          </div>
                          {order.totalRefunded && (
                            <div className="flex justify-between text-green-600">
                              <span>Refunded:</span>
                              <span>${(order.totalRefunded.amount / 100).toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-between items-center pt-4 border-t">
                        <div className="text-sm text-gray-500">
                          Last updated: {formatDate(order.updatedAt)}
                        </div>
                        <div className="flex space-x-2">
                          {order.shippingOut?.trackingUrl && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => order.shippingOut?.trackingUrl && window.open(order.shippingOut.trackingUrl, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Track Package
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
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