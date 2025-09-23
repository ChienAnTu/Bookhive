"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Package, Truck, CheckCircle } from "lucide-react";
import Card from "@/app/components/ui/Card";
import { getCurrentUser, isAuthenticated } from "@/utils/auth";
import { getOrders, type Order } from "@/utils/borrowingOrders";

const ShippingPage: React.FC = () => {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
          const ordersData = await getOrders();
          setOrders(ordersData);
        } else {
          router.push("/login");
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex-1 bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-gray-500">Loading shipping information...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Shipping & Orders</h1>
          <p className="text-gray-600">Track your order shipments and delivery status</p>
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
              <Truck className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">In Transit</p>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.filter(o => o.status.toLowerCase().includes("ship")).length}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="shadow-sm">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.filter(o => o.status.toLowerCase().includes("complete")).length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Your Orders</h2>
          
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No orders found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.order_id} className="border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold">Order #{order.order_id}</h3>
                      <p className="text-sm text-gray-600">Status: {order.status}</p>
                      <p className="text-sm text-gray-600">Amount: ${order.total_paid_amount}</p>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
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
                        <div>
                          <p className="font-medium">{book.title}</p>
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

export default ShippingPage;
