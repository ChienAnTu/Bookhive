"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Star, MapPin, Calendar, Book, Edit } from "lucide-react";
import { getCurrentUser, isAuthenticated } from "../../utils/auth";
import {
  getUserLendingOrders,
  getUserBorrowingOrders,
  mockOrders,
  mockUsers,
  mockBooks,
} from "../data/mockData";
import Link from "next/link";
import StarRating from "../components/ui/StarRating";
import Button from "../components/ui/Button";
import { 
  mockComments, 
  getUserRatingStats, 
  getUserReceivedComments,
} from "../data/mockData";
import { Comment } from '../types';
import { User } from '../types/user';



// User data interface
interface UserData {
  id: string;
  name: string;
  email: string;
  location: string;
  avatar: string;
  createdAt: string;
  // Additional fields that might be needed for profile
  rating?: number;
  booksLent?: number;
  booksBorrowed?: number;
}

const ProfilePage: React.FC = () => {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  // Get user's orders (using mock data for now)
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

  // Format join date from createdAt
  const joinDate = new Date(currentUser.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  // Use default values for rating and books if not provided by API
  const rating = currentUser.rating || 0;
  const booksLent = currentUser.booksLent || 0;
  const booksBorrowed = currentUser.booksBorrowed || 0;

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
            <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-semibold">
              {currentUser.name.split(' ').map(n => n.charAt(0)).join('')}
            </div>

            {/* User name */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {currentUser.name}
              </h1>

              {/* Email */}
              <div className="flex items-center text-gray-600 mb-2">
                <span className="text-sm">{currentUser.email}</span>
              </div>

              {/* Location */}
              <div className="flex items-center text-gray-600 mb-2">
                <MapPin className="w-4 h-4 mr-2" />
                <span className="text-sm">
                  {currentUser.location || "Location not set"}
                </span>
              </div>

              {/* Star Rating */}
              {rating > 0 && (
                <div className="flex items-center mb-2">
                  <div className="flex items-center mr-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${star <= fullStars
                          ? "text-yellow-400 fill-current"
                          : star === fullStars + 1 && hasHalfStar
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                          }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {rating} ({booksBorrowed} reviews)
                  </span>
                </div>
              )}



              {/* Books Lent */}
              <div className="flex items-center text-gray-600 mb-2">
                <Book className="w-4 h-4 mr-2" />
                <span className="text-sm">{booksLent} books lent out</span>
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            My Orders
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {/* Lending */}
            <Link
              href="/lend"
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
              href="/borrow"
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

          {/* Recent Orders for Reviews */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Completed Orders</h3>
              <Link 
                href="/orders" 
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View All Orders
              </Link>
            </div>
            
            {(() => {
              const recentCompletedOrders = mockOrders
                .filter(order => 
                  (order.borrowerId === currentUser.id || order.lenderId === currentUser.id) &&
                  (order.status === 'delivered' || order.status === 'completed')
                )
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 3);

              return recentCompletedOrders.length > 0 ? (
                <div className="space-y-3">
                  {recentCompletedOrders.map(order => {
                    const book = mockBooks.find(b => b.id === order.bookId);
                    const isUserBorrower = order.borrowerId === currentUser.id;
                    const otherUserId = isUserBorrower ? order.lenderId : order.borrowerId;
                    const otherUser = mockUsers.find(u => u.id === otherUserId);
                    
                    if (!book || !otherUser) return null;
                    
                    return (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-16 bg-gray-200 rounded flex-shrink-0 overflow-hidden">
                            {book.coverImgUrl ? (
                              <img
                                src={book.coverImgUrl}
                                alt={book.titleOr}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                <span className="text-lg">📚</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{book.titleOr}</p>
                            <p className="text-xs text-gray-600">
                              {isUserBorrower ? 'Borrowed from' : 'Lent to'} {otherUser.firstName} {otherUser.lastName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Link href={`/orders/${order.id}/review`}>
                          <Button 
                            size="sm"
                            className="bg-black text-white hover:bg-gray-800"
                          >
                            Write Review
                          </Button>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p className="text-sm">No completed orders yet</p>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Reviews that I've written Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Reviews that I've written
            </h2>
            <Link 
              href="/profile/reviews" 
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              See More &gt;&gt;
            </Link>
          </div>

          {(() => {
            // Get reviews written by this user
            const givenComments = mockComments.filter(comment => comment.reviewerId === currentUser.id);
            
            return givenComments.length > 0 ? (
              <div className="space-y-4">
                {givenComments.slice(0, 3).map(comment => {
                  const reviewee = mockUsers.find(user => user.id === comment.revieweeId);
                  return (
                    <div key={comment.id} className="flex items-start space-x-4 pb-4 border-b border-gray-100 last:border-b-0">
                      <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                        {reviewee?.firstName?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <h4 className="font-semibold text-gray-900 mr-2">
                            {reviewee?.firstName || 'Unknown User'}
                          </h4>
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${star <= comment.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No reviews written yet</p>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
