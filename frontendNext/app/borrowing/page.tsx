"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Package, Clock, AlertTriangle, Search, Filter } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { getCurrentUser, isAuthenticated } from "@/utils/auth";
import { getBorrowingOrders, type Order } from "@/utils/borrowingOrders";

const BorrowingPage: React.FC = () => {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated()) {
        router.push("/login");
        return;
      }

      try {
        const userData = await getCurrentUser();
        if (userData) {
          setCurrentUser(userData);
          const ordersData = await getBorrowingOrders();
          setOrders(ordersData);
        } else {
          router.push("/login");
        }
      } catch (error) {
        console.error("Failed to load borrowing data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [router]);

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === "all" || order.status.toLowerCase().includes(statusFilter.toLowerCase());
    const matchesSearch = searchTerm === "" || 
      order.books.some(book => book.title.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex-1 bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-gray-500">Loading borrowing information...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Borrowing Orders</h1>
          <p className="text-gray-600">Track your borrowed books and manage orders</p>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search books..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="borrowing">Borrowing</option>
              <option value="overdue">Overdue</option>
              <option value="returned">Returned</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-sm">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="shadow-sm">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Active Borrowing</p>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.filter(o => o.status.toLowerCase().includes("borrowing")).length}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="shadow-sm">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.filter(o => o.status.toLowerCase().includes("overdue")).length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Borrowing Orders</h2>
          
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No borrowing orders found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card key={order.order_id} className="border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold">Order #{order.order_id}</h3>
                      <p className="text-sm text-gray-600">Status: {order.status}</p>
                      <p className="text-sm text-gray-600">Amount: ${order.total_paid_amount}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      order.status.toLowerCase().includes("overdue") ? "bg-red-100 text-red-800" :
                      order.status.toLowerCase().includes("borrowing") ? "bg-green-100 text-green-800" :
                      order.status.toLowerCase().includes("pending") ? "bg-yellow-100 text-yellow-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Books:</h4>
                    {order.books.map((book, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <img 
                          src={book.cover || "/placeholder-book.jpg"} 
                          alt={book.title}
                          className="w-12 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{book.title}</p>
                          <p className="text-sm text-gray-500">Author: {book.author || "Unknown"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default BorrowingPage;
