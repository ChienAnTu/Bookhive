"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Star, MapPin, Calendar, Book, Edit } from "lucide-react";
import { getCurrentUser, isAuthenticated } from "../../utils/auth";
import { getBorrowingOrders, getLendingOrders } from "@/utils/orders";
import Link from "next/link";
import Avatar from "@/app/components/ui/Avatar";
import type { User } from "@/app/types/user";

const ProfilePage: React.FC = () => {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lendingOrders, setLendingOrders] = useState<any[]>([]);
  const [borrowingOrders, setBorrowingOrders] = useState<any[]>([]);
  console.log("adrress:", currentUser?.streetAddress);

  // Check authentication and load user data
  useEffect(() => {
    const loadUserData = async () => {
      // Check if user is authenticated
      if (!isAuthenticated()) {
        router.push("/login");
        return;
      }

      try {
        // Get user data from API
        const userData = await getCurrentUser();
        if (userData) {
          setCurrentUser(userData);
          
          // Load user's orders
          const [lending, borrowing] = await Promise.all([
            getLendingOrders(),
            getBorrowingOrders()
          ]);
          
          setLendingOrders(lending);
          setBorrowingOrders(borrowing);
        } else {
          // If getCurrentUser returns null, redirect to login
          router.push("/login");
        }
      } catch (error) {
        console.error("Failed to load user data:", error);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex-1 bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  // Show error state if no user data
  if (!currentUser) {
    return (
      <div className="flex-1 bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-gray-500">Unable to load profile data</div>
      </div>
    );
  }

  // Count orders by status
  const ongoingLending = lendingOrders.filter(
    (order) => order.status === "BORROWING"
  ).length;
  const ongoingBorrowing = borrowingOrders.filter(
    (order) => order.status === "BORROWING"
  ).length;
  const shippingOrders = [...lendingOrders, ...borrowingOrders].filter(
    (order) =>
      (order.borrowerId === currentUser.id || order.ownerId === currentUser.id) &&
      order.status === "PENDING_SHIPMENT"
  ).length;

  // Format join date from createdAt
  const joinDate = new Date(currentUser.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  // Use default values for rating and books if not provided by API
  const rating = (currentUser as any).rating || 0;
  const booksLent = (currentUser as any).booksLent || 0;
  const booksBorrowed = (currentUser as any).booksBorrowed || 0;

  // Calculate star rating display
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;

  return (
    <div className="flex-1 bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Basic Info Section */}
        <div className="relative bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          {/* Edit Button */}
          <Link
            href="/profile/edit"
            className="absolute top-4 right-4 px-4 py-2 text-sm text-black rounded-md hover:bg-gray-100 transition flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />Edit
          </Link>

          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
            {/* Profile Photo */}
            <Avatar user={currentUser} size={96} />

            {/* User name */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {currentUser.name}
              </h1>

              {/* Email */}
              <div className="flex items-center text-gray-600 mb-2">
                <span className="text-sm">{currentUser.email}</span>
              </div>

              {/* Renting stars */}
              <div className="flex items-center mt-2 mb-2">
                <div className="flex items-center mr-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${star <= Math.floor(rating)
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                        }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {rating.toFixed(1)}
                </span>
              </div>

              {/* Location */}
              <div className="flex items-center text-gray-600 mb-2">
                <MapPin className="w-4 h-4 mr-2" />
                <p>
                  {[
                    currentUser.streetAddress,
                    currentUser.city,
                    currentUser.state,
                    currentUser.zipCode,
                  ].filter(Boolean).join(", ")}
                </p>
              </div>

              {/* Member Since */}
              <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                <span className="text-sm">Member since {joinDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* My Orders Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            My Orders
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Lending */}
            <Link
              href="/lending"
              className="block bg-blue-50 border border-blue-200 rounded-lg p-4 text-center hover:bg-blue-100 transition"
            >
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {ongoingLending}
              </div>
              <div className="text-sm font-medium text-blue-800">Lending</div>
              <div className="text-xs text-blue-600 mt-1">
                Books you're lending
              </div>
            </Link>

            {/* Borrowing */}
            <Link
              href="/borrowing"
              className="block bg-green-50 border border-green-200 rounded-lg p-4 text-center hover:bg-green-100 transition"
            >
              <div className="text-2xl font-bold text-green-600 mb-1">
                {ongoingBorrowing}
              </div>
              <div className="text-sm font-medium text-green-800">
                Borrowing
              </div>
              <div className="text-xs text-green-600 mt-1">
                Books you're borrowing
              </div>
            </Link>

            {/* Shipping */}
            <Link
              href="/shipping"
              className="block bg-orange-50 border border-orange-200 rounded-lg p-4 text-center hover:bg-orange-100 transition"
            >
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {shippingOrders}
              </div>
              <div className="text-sm font-medium text-orange-800">
                Shipping
              </div>
              <div className="text-xs text-orange-600 mt-1">
                Books in transit
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
