"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Star, MapPin, Calendar, Book, Edit } from "lucide-react";
import { getCurrentUser, isAuthenticated } from "../../utils/auth";
import Link from "next/link";
import Avatar from "@/app/components/ui/Avatar";
import type { User } from "@/app/types/user";

const ProfilePage: React.FC = () => {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"Received" | "Given">("Received");
  const tabs: ("Received" | "Given")[] = ["Received", "Given"];


  // Check authentication and load user data
  useEffect(() => {
    const loadUserData = async () => {
      // Check if user is authenticated
      if (!isAuthenticated()) {
        router.push("/auth");
        return;
      }

      try {
        // Get user data from API
        const userData = await getCurrentUser();
        if (userData) {
          setCurrentUser(userData);
        } else {
          // If getCurrentUser returns null, redirect to login
          router.push("/login");
        }
      } catch (error) {
        console.error("Failed to load user data:", error);
        router.push("/auth");
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


  // Format join date from createdAt
  const joinDate = new Date(currentUser.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  // Use default values for rating and books if not provided by API
  const rating = (currentUser as any).rating || 0;


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
                {currentUser.firstName} {currentUser.lastName}
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
            My Book Hub
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Lending */}
            <Link
              href="/lending"
              className="block bg-blue-50 border border-blue-200 rounded-lg p-4 text-center hover:bg-blue-100 transition"
            >
              <div className="text-xl font-bold text-blue-600 mb-1">
                Lending
              </div>
              <div className="text-sm font-medium text-blue-800">
                Books you’re sharing
              </div>
            </Link>

            {/* Borrowing */}
            <Link
              href="/borrowing"
              className="block bg-green-50 border border-green-200 rounded-lg p-4 text-center hover:bg-green-100 transition"
            >
              <div className="text-xl font-bold text-green-600 mb-1">
                Borrowing
              </div>
              <div className="text-sm font-medium text-green-800">
                Your borrowed books
              </div>
            </Link>

            {/* Shipping */}
            <Link
              href="/shipping"
              className="block bg-orange-50 border border-orange-200 rounded-lg p-4 text-center hover:bg-orange-100 transition"
            >
              <div className="text-xl font-bold text-orange-600 mb-1">
                Shipping
              </div>
              <div className="text-sm font-medium text-orange-800">
                Books in transit
              </div>
            </Link>
          </div>
        </div>

        {/* Review Summary Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Review Summary
          </h2>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-4">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium ${activeTab === tab
                    ? "border-b-2 border-black text-black"
                    : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                {tab === "Received" ? "Reviews I Received" : "Reviews I Gave"}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "Received" ? (
            currentUser.receivedReviews && currentUser.receivedReviews.length > 0 ? (
              <div className="space-y-4">
                {currentUser.receivedReviews.map((review, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-800">
                        {review.reviewerName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString("en-US")}
                      </span>
                    </div>
                    <div className="flex items-center mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${star <= Math.floor(review.rating)
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                            }`}
                        />
                      ))}
                      <span className="ml-2 text-sm text-gray-600">{review.rating}</span>
                    </div>
                    <p className="text-gray-700 text-sm">{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No reviews received yet.</p>
            )
          ) : (
            currentUser.givenReviews && currentUser.givenReviews.length > 0 ? (
              <div className="space-y-4">
                {currentUser.givenReviews.map((review, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-800">
                        To: {review.targetUserName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString("en-US")}
                      </span>
                    </div>
                    <div className="flex items-center mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${star <= Math.floor(review.rating)
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                            }`}
                        />
                      ))}
                      <span className="ml-2 text-sm text-gray-600">{review.rating}</span>
                    </div>
                    <p className="text-gray-700 text-sm">{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No reviews given yet.</p>
            )
          )}
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;
