"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Star } from 'lucide-react';
import Button from '@/app/components/ui/Button';
import Modal from '@/app/components/ui/Modal';
import StarRating from '@/app/components/ui/StarRating';
import { getCurrentUser, getOrderById, getUserById, reviewTags } from '@/app/data/mockData';
import { Comment } from '@/app/types';

export default function OrderReviewPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    content: '',
    tags: [] as string[],
    isAnonymous: false
  });

  const currentUser = getCurrentUser();
  const order = getOrderById(orderId);
  
  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h2>
            <p className="text-gray-600 mb-6">The order you're looking for doesn't exist.</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }

  // Determine which user to review (borrower reviews lender, lender reviews borrower)
  const revieweeId = order.borrowerId === currentUser.id ? order.lenderId : order.borrowerId;
  const reviewee = getUserById(revieweeId);
  const isUserBorrower = order.borrowerId === currentUser.id;

  const handleSubmitReview = () => {
    if (!newReview.content.trim()) {
      return;
    }

    const review: Comment = {
      id: `comment_${Date.now()}`,
      reviewerId: currentUser.id,
      revieweeId: revieweeId,
      orderId: orderId,
      bookId: order.bookId,
      rating: newReview.rating,
      content: newReview.content,
      tags: newReview.tags,
      type: isUserBorrower ? "lender" : "borrower",
      isAnonymous: newReview.isAnonymous,
      createdAt: new Date().toISOString(),
      helpfulCount: 0
    };

    // Here should call API to save the comment
    console.log('Submitting review:', review);

    // Reset form
    setNewReview({
      rating: 5,
      content: '',
      tags: [],
      isAnonymous: false
    });
    setIsReviewModalOpen(false);

    // Return to profile page
    router.push('/profile');
  };

  const toggleTag = (tag: string) => {
    setNewReview(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Write a Review
          </h1>
          <p className="text-gray-600">
            Share your experience about this {isUserBorrower ? 'lending' : 'borrowing'} transaction
          </p>
        </div>

        {/* Order Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Order ID:</span>
              <span className="ml-2 text-sm text-gray-900">{orderId}</span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">
                {isUserBorrower ? 'Lender:' : 'Borrower:'}
              </span>
              <span className="ml-2 text-sm text-gray-900">
                {reviewee?.firstName} {reviewee?.lastName}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Status:</span>
              <span className="ml-2 text-sm text-gray-900 capitalize">{order.status}</span>
            </div>
          </div>
        </div>

        {/* Review Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Your Review</h2>
          
          <div className="space-y-6">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Overall Rating
              </label>
              <div className="flex items-center gap-2">
                <StarRating
                  rating={newReview.rating}
                  onRatingChange={(rating) => setNewReview(prev => ({ ...prev, rating }))}
                  size="lg"
                />
                <span className="text-sm text-gray-600">
                  ({newReview.rating} star{newReview.rating !== 1 ? 's' : ''})
                </span>
              </div>
            </div>

            {/* Review Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Your Experience
              </label>
              <textarea
                value={newReview.content}
                onChange={(e) => setNewReview(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Share your experience with this user..."
                rows={5}
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Add Tags (Optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {reviewTags.map((tag: string) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      newReview.tags.includes(tag)
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Anonymous Option */}
            <div className="flex items-center">
              <input
                id="anonymous"
                type="checkbox"
                checked={newReview.isAnonymous}
                onChange={(e) => setNewReview(prev => ({ ...prev, isAnonymous: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="anonymous" className="ml-2 text-sm text-gray-700">
                Submit this review anonymously
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitReview}
                disabled={!newReview.content.trim()}
              >
                Submit Review
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}