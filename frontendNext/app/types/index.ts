export * from "./user";
export * from "./book";
export * from "./order";

// API response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// Comment (review)
export interface Comment {
  id: string;
  orderId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
  createdAt: string;

  reviewerName?: string;
  revieweeName?: string;
}


// Rating
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
}

