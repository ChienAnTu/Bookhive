export * from "./user";
export * from "./book";
export * from "./order";

// 简单的 API 响应
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// 评论和评分接口
export interface Comment {
  id: string;
  orderId: string;
  reviewerId: string; // 评价者ID
  revieweeId: string; // 被评价者ID
  bookId: string;
  rating: number; // 1-5星评分
  content: string; // 评价内容
  tags?: string[]; // 评价标签，如 "friendly", "punctual", "good condition" 等
  type: "lender" | "borrower"; // 评价类型：对出借者还是借阅者的评价
  createdAt: string;
  updatedAt?: string;
  isAnonymous?: boolean; // 是否匿名评价
  helpfulCount?: number; // 有用的评价数
  reportCount?: number; // 举报数
}

// 评价统计接口
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
