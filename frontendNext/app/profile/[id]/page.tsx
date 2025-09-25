"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Star, MapPin, Calendar, Ban } from "lucide-react";
import Link from "next/link";
import Avatar from "@/app/components/ui/Avatar";
import type { User } from "@/app/types/user";
import { getUserById } from "@/utils/auth";
import type { RatingStats, Comment } from "@/app/types/index";
import StarRating from '@/app/components/ui/StarRating';

const UserProfilePage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);

  const [ratingStats, setRatingStats] = useState<RatingStats>({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    recentComments: [],
  });

  useEffect(() => {
    if (!userId) return;
    const loadUser = async () => {
      try {
        const data = await getUserById(userId);
        if (data) {
          setUser(data);
        } else {
          router.push("/404"); // 用户不存在时跳404
        }
      } catch (err) {
        console.error(err);
        router.push("/404");
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, [userId, router]);


  const handleBlockUser = async (userId: string) => {
    if (!confirm("Are you sure you want to block this user?")) return;
    try {
      // TODO: 调用 block API
      console.log(`Blocked user: ${userId}`);
      setIsBlocked(true);
    } catch (err) {
      console.error(err);
      alert("Failed to block user.");
    }
  };

  const handleUnblockUser = async (userId: string) => {
    try {
      // TODO: 调用 unblock API
      console.log(`Unblocked user: ${userId}`);
      setIsBlocked(false);
    } catch (err) {
      console.error(err);
      alert("Failed to unblock user.");
    }
  };

// TODO: Review API

  if (isLoading) {
    return <div className="p-8 text-gray-500">Loading user profile...</div>;
  }

  if (!user) {
    return <div className="p-8 text-gray-500">User not found</div>;
  }

  const joinDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  if (isBlocked) {
    return (
      <div className="flex-1 bg-gray-50 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {user.firstName} {user.lastName}
          </h1>
          <button
            onClick={() => handleUnblockUser(user.id)}
            className="w-full bg-green-50 border border-green-200 text-green-600 font-medium py-2 px-4 rounded-lg hover:bg-green-100 transition"
          >
            Unblock
          </button>
        </div>
      </div>
    );
  } else

    return (

      <div className="flex-1 bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Basic Info Section */}
          <div className="relative bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            {/* Block User Icon */}
            <button
              onClick={() => handleBlockUser(user.id)}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:bg-orange-100 rounded-full transition"
              title="Block User"
            >
              <Ban className="w-5 h-5" />
            </button>

            <div className="flex items-start space-x-6">
              <Avatar user={user} size={96} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.firstName} {user.lastName}
                </h1>
                <p className="text-gray-600 mb-2">{user.email}</p>

                {/* Rating */}
                <div className="flex items-center mb-2">
                  <StarRating rating={ratingStats.averageRating} readonly size="sm" />
                  <span className="ml-2 text-sm text-gray-600">
                    {ratingStats.averageRating.toFixed(1)} ({ratingStats.totalReviews} reviews)
                  </span>
                </div>

                {/* Address */}
                <div className="flex items-center text-gray-600 mb-2">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>
                    {[user.streetAddress, user.city, user.state, user.zipCode]
                      .filter(Boolean)
                      .join(", ")}
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

          {/* User Reviews */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Reviews for {user.firstName}
            </h2>

            {ratingStats.recentComments.length > 0 ? (
              <div className="space-y-4">
                {ratingStats.recentComments.map((review) => (
                  <div key={review.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-800">
                        Reviewer: {review.reviewerId}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString("en-US")}
                      </span>
                    </div>
                    <StarRating rating={review.rating} readonly size="sm" />
                    <span className="ml-2 text-sm text-gray-600">{review.rating}</span>
                    <p className="text-gray-700 text-sm">{review.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No reviews yet for this user.</p>
            )}
          </div>
        </div>
      </div>
    );
};

export default UserProfilePage;
