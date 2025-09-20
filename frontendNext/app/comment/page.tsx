'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import Modal from '@/app/components/ui/Modal';
import Input from '@/app/components/ui/Input';
import StarRating from '@/app/components/ui/StarRating';
import { Comment, RatingStats } from '@/app/types';
import { User } from '@/app/types/user';
import { 
  mockComments, 
  getUserRatingStats, 
  getUserGivenComments, 
  getUserReceivedComments,
  mockUsers 
} from '@/app/data/mockData';

// Comment Card Component
interface CommentCardProps {
  comment: Comment;
  showReviewerInfo?: boolean;
}

const CommentCard: React.FC<CommentCardProps> = ({ comment, showReviewerInfo = true }) => {
  const reviewer = mockUsers.find(user => user.id === comment.reviewerId);
  const reviewee = mockUsers.find(user => user.id === comment.revieweeId);

  return (
    <Card className="p-4 mb-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          {showReviewerInfo && (
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                {comment.isAnonymous ? 'A' : (reviewer?.firstName.charAt(0) || 'U')}
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {comment.isAnonymous ? 'Anonymous User' : `${reviewer?.firstName} ${reviewer?.lastName}` || 'Unknown User'}
                </p>
                <p className="text-sm text-gray-500">
                  Rating {`${reviewee?.firstName} ${reviewee?.lastName}` || 'Unknown User'} as {comment.type === 'lender' ? 'Lender' : 'Borrower'}
                </p>
              </div>
            </div>
          )}
          <StarRating rating={comment.rating} readonly size="sm" />
        </div>
        <div className="text-right">
          <span className="text-sm text-gray-500">
            {new Date(comment.createdAt).toLocaleDateString('en-US')}
          </span>
        </div>
      </div>
      
      <p className="text-gray-700 mb-3">{comment.content}</p>
      
      {comment.tags && comment.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {comment.tags.map((tag, index) => (
            <span 
              key={index}
              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{comment.type === 'lender' ? 'Review for Lender' : 'Review for Borrower'}</span>
        {comment.helpfulCount && comment.helpfulCount > 0 && (
          <span>👍 {comment.helpfulCount} people found this helpful</span>
        )}
      </div>
    </Card>
  );
};

// User Rating Overview Component
interface UserRatingOverviewProps {
  userId: string;
  stats: RatingStats;
}

const UserRatingOverview: React.FC<UserRatingOverviewProps> = ({ userId, stats }) => {
  const user = mockUsers.find(u => u.id === userId);

  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-lg font-medium mr-4">
          {user?.firstName.charAt(0) || 'U'}
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{`${user?.firstName} ${user?.lastName}` || 'Unknown User'}</h2>
          <p className="text-gray-600">{user?.city || 'Unknown Location'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center mb-2">
            <StarRating rating={Math.round(stats.averageRating)} readonly size="lg" />
            <span className="text-2xl font-bold text-gray-900 ml-3">
              {stats.averageRating.toFixed(1)}
            </span>
          </div>
          <p className="text-gray-600">Based on {stats.totalReviews} reviews</p>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-3">Rating Distribution</h4>
          {[5, 4, 3, 2, 1].map(rating => {
            const count = stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution];
            const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
            
            return (
              <div key={rating} className="flex items-center mb-1">
                <span className="text-sm text-gray-600 w-8">{rating} star</span>
                <div className="flex-1 mx-2 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-8">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

// Main Page Component
const CommentPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'received' | 'given'>('overview');
  const [selectedUserId, setSelectedUserId] = useState(mockUsers[0]?.id || '');
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [newComment, setNewComment] = useState({
    rating: 5,
    content: '',
    tags: [] as string[],
    type: 'lender' as 'lender' | 'borrower',
    isAnonymous: false
  });

  const userStats = getUserRatingStats(selectedUserId);
  const receivedComments = getUserReceivedComments(selectedUserId);
  const givenComments = getUserGivenComments(selectedUserId);

  const handleWriteComment = () => {
    // Here you can add comment submission logic
    console.log('Submit comment:', newComment);
    setIsWriteModalOpen(false);
    // Reset form
    setNewComment({
      rating: 5,
      content: '',
      tags: [],
      type: 'lender',
      isAnonymous: false
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">User Reviews & Ratings</h1>
          <Button variant="primary" onClick={() => setIsWriteModalOpen(true)}>
            Write Review
          </Button>
        </div>

        {/* User Selection */}
        <Card className="p-4 mb-6">
          <div className="flex items-center space-x-4">
            <label htmlFor="user-select" className="text-sm font-medium text-gray-700">
              View User:
            </label>
            <select
              id="user-select"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="flex-1 max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            >
              {mockUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} ({user.city})
                </option>
              ))}
            </select>
          </div>
        </Card>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'received', label: `Received Reviews (${receivedComments.length})` },
            { key: 'given', label: `Given Reviews (${givenComments.length})` }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-black text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        {activeTab === 'overview' && (
          <UserRatingOverview userId={selectedUserId} stats={userStats} />
        )}

        {activeTab === 'received' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Received Reviews</h2>
            {receivedComments.length > 0 ? (
              receivedComments.map(comment => (
                <CommentCard key={comment.id} comment={comment} />
              ))
            ) : (
              <Card className="p-8 text-center">
                <p className="text-gray-500">No received reviews yet</p>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'given' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Given Reviews</h2>
            {givenComments.length > 0 ? (
              givenComments.map(comment => (
                <CommentCard key={comment.id} comment={comment} showReviewerInfo={false} />
              ))
            ) : (
              <Card className="p-8 text-center">
                <p className="text-gray-500">No given reviews yet</p>
              </Card>
            )}
          </div>
        )}

        {/* Write Review Modal */}
        <Modal
          isOpen={isWriteModalOpen}
          onClose={() => setIsWriteModalOpen(false)}
          title="Write Review"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              <StarRating
                rating={newComment.rating}
                onRatingChange={(rating) => setNewComment({...newComment, rating})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Type
              </label>
              <select
                value={newComment.type}
                onChange={(e) => setNewComment({...newComment, type: e.target.value as 'lender' | 'borrower'})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              >
                <option value="lender">Review for Lender</option>
                <option value="borrower">Review for Borrower</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Content
              </label>
              <textarea
                value={newComment.content}
                onChange={(e) => setNewComment({...newComment, content: e.target.value})}
                placeholder="Write your review..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              />
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newComment.isAnonymous}
                  onChange={(e) => setNewComment({...newComment, isAnonymous: e.target.checked})}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Anonymous Review</span>
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsWriteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleWriteComment}>
                Submit Review
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default CommentPage;