"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Package, Truck, CheckCircle } from "lucide-react";
import Card from "@/app/components/ui/Card";
import { getCurrentUser, isAuthenticated } from "@/utils/auth";
import { getUserAuspostTrackingNumbers, type TrackingNumberItem } from "@/utils/shipping";
import clsx from "clsx";

const ShippingPage: React.FC = () => {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [trackingNumbers, setTrackingNumbers] = useState<TrackingNumberItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"sent" | "received">("sent");

  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated()) {
        router.push("/auth");
        return;
      }

      try {
        const userData = await getCurrentUser();
        if (userData) {
          setCurrentUser(userData);
          const trackingData = await getUserAuspostTrackingNumbers();
          setTrackingNumbers(trackingData);
        } else {
          router.push("/auth");
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

  const sentList = trackingNumbers.filter(
    (t) => !!t.shipping_out_tracking_number
  );
  const receivedList = trackingNumbers.filter(
    (t) => !!t.shipping_return_tracking_number
  );
  const currentList = activeTab === "sent" ? sentList : receivedList;

  return (
    <div className="flex-1 bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Shipping</h1>
          <p className="text-gray-600">Track your outgoing and incoming shipments</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-sm">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Shipments</p>
                <p className="text-2xl font-bold text-gray-900">{trackingNumbers.length}</p>
              </div>
            </div>
          </Card>
          <Card className="shadow-sm">
            <div className="flex items-center">
              <Truck className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Sent Out</p>
                <p className="text-2xl font-bold text-gray-900">{sentList.length}</p>
              </div>
            </div>
          </Card>
          <Card className="shadow-sm">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Received</p>
                <p className="text-2xl font-bold text-gray-900">{receivedList.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex border-b mb-4">
          <button
            onClick={() => setActiveTab("sent")}
            className={clsx(
              "px-4 py-2 font-medium text-sm border-b-2 transition",
              activeTab === "sent"
                ? "border-black text-black"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            Sent Out
          </button>
          <button
            onClick={() => setActiveTab("received")}
            className={clsx(
              "px-4 py-2 font-medium text-sm border-b-2 transition",
              activeTab === "received"
                ? "border-black text-black"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            Received
          </button>
        </div>

        <Card className="shadow-sm">
          <h2 className="text-xl font-semibold mb-4">
            {activeTab === "sent" ? "Shipments You Sent" : "Shipments You Received"}
          </h2>

          {currentList.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No shipments found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentList.map((item) => (
                <Card key={item.order_id} className="border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <h3
                      className="font-semibold text-black hover:underline cursor-pointer"
                      onClick={() => router.push(`/borrowing/${item.order_id}`)}
                    >
                      Order #{item.order_id}
                    </h3>
                  </div>

                  <div className="text-sm text-gray-700">
                    {activeTab === "sent" && item.shipping_out_tracking_number && (
                      <p>
                        Outgoing Tracking:{" "}
                        <a
                          href={`https://auspost.com.au/mypost/track/details/${item.shipping_out_tracking_number}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-blue-600 underline hover:text-blue-800"
                        >
                          {item.shipping_out_tracking_number}
                        </a>
                      </p>
                    )}

                    {activeTab === "received" && item.shipping_return_tracking_number && (
                      <p>
                        Return Tracking:{" "}
                        <a
                          href={`https://auspost.com.au/mypost/track/details/${item.shipping_return_tracking_number}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-green-600 underline hover:text-green-800"
                        >
                          {item.shipping_return_tracking_number}
                        </a>
                      </p>
                    )}

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
