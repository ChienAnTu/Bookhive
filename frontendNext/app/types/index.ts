export * from "./user";
export * from "./book";
export * from "./order";
export * from "./lending";
export * from "./complaint";

// Simple API response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// Comment and rating interfaces
export interface Comment {
  id: string;
  orderId: string;
  reviewerId: string; // Reviewer ID
  revieweeId: string; // Reviewee ID
  bookId: string;
  rating: number; // 1-5 star rating
  content: string; // Review content
  tags?: string[]; // Review tags like "friendly", "punctual", "good condition" etc
  type: "lender" | "borrower"; // Review type: for lender or borrower
  createdAt: string;
  updatedAt?: string;
  isAnonymous?: boolean; // Whether anonymous review
  helpfulCount?: number; // Number of helpful reviews
  reportCount?: number; // Number of reports
}

// Review statistics interface
export interface RatingStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  recentComments: Comment[];
}
