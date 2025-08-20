"use client";

import React from "react";
import { Star, MapPin, Calendar, Book } from "lucide-react";
import {
  getCurrentUser,
  getUserLendingOrders,
  getUserBorrowingOrders,
  mockOrders,
} from "../data/mockData";

const ProfilePage: React.FC = () => {
  // Get current user data
  const currentUser = getCurrentUser();

  // Get user's orders
  const lendingOrders = getUserLendingOrders(currentUser.id);
  const borrowingOrders = getUserBorrowingOrders(currentUser.id);

  // Count orders by status
  const ongoingLending = lendingOrders.filter(
    (order) => order.status === "ongoing"
  ).length;
  const ongoingBorrowing = borrowingOrders.filter(
    (order) => order.status === "ongoing"
  ).length;
  const shippingOrders = mockOrders.filter(
    (order) =>
      (order.lenderId === currentUser.id ||
        order.borrowerId === currentUser.id) &&
      order.deliveryMethod === "post" &&
      order.status === "ongoing"
  ).length;

  // Format join date
  const joinDate = new Date(currentUser.joinDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  // Calculate star rating display
  const fullStars = Math.floor(currentUser.rating);
  const hasHalfStar = currentUser.rating % 1 !== 0;

  return (
    <div className=" flex-1 bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Basic Info Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
            {/* Profile Photo */}
            <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
              <img
                src={currentUser.avatar}
                alt="User Profile"
                className="w-full h-full object-cover"
              />
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {currentUser.name}
              </h1>

              {/* Location */}
              <div className="flex items-center text-gray-600 mb-2">
                <MapPin className="w-4 h-4 mr-2" />
                <span className="text-sm">{currentUser.location}</span>
              </div>

              {/* Star Rating */}
              <div className="flex items-center mb-2">
                <div className="flex items-center mr-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= fullStars
                          ? "text-yellow-400 fill-current"
                          : star === fullStars + 1 && hasHalfStar
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {currentUser.rating} ({currentUser.booksBorrowed} reviews)
                </span>
              </div>

              {/* Books Lent */}
              <div className="flex items-center text-gray-600 mb-2">
                <Book className="w-4 h-4 mr-2" />
                <span className="text-sm">
                  {currentUser.booksLent} books lent out
                </span>
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {ongoingLending}
              </div>
              <div className="text-sm font-medium text-blue-800">Lending</div>
              <div className="text-xs text-blue-600 mt-1">
                Books you're lending
              </div>
            </div>

            {/* Borrowing */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {ongoingBorrowing}
              </div>
              <div className="text-sm font-medium text-green-800">
                Borrowing
              </div>
              <div className="text-xs text-green-600 mt-1">
                Books you're borrowing
              </div>
            </div>

            {/* Shipping */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {shippingOrders}
              </div>
              <div className="text-sm font-medium text-orange-800">
                Shipping
              </div>
              <div className="text-xs text-orange-600 mt-1">
                Books in transit
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
